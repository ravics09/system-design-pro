import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../../config/index.js";
import type { ObjectHead, StorageProvider } from "./storage.interface.js";

/**
 * S3-backed storage. The bucket is PRIVATE — all writes happen through
 * pre-signed URLs and all public reads happen through the CDN.
 */
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly uploadBucket: string;
  private readonly derivedBucket: string;

  constructor() {
    this.client = new S3Client({
      region: config.AWS_REGION,
      ...(config.S3_ENDPOINT ? { endpoint: config.S3_ENDPOINT } : {}),
      forcePathStyle: config.S3_FORCE_PATH_STYLE,
    });
    this.uploadBucket = config.UPLOAD_BUCKET;
    this.derivedBucket = config.DERIVED_BUCKET;
  }

  async presignPut(params: {
    key: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<string> {
    // Pinning ContentType means the client MUST send this exact header, and the
    // signature won't validate otherwise — a cheap first line of validation.
    const command = new PutObjectCommand({
      Bucket: this.uploadBucket,
      Key: params.key,
      ContentType: params.contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: params.expiresInSeconds });
  }

  async head(key: string): Promise<ObjectHead | null> {
    try {
      const res = await this.client.send(
        new HeadObjectCommand({ Bucket: this.uploadBucket, Key: key }),
      );
      return { size: res.ContentLength ?? 0, contentType: res.ContentType };
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async getBytes(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.uploadBucket, Key: key }),
    );
    const body = res.Body as unknown as AsyncIterable<Uint8Array> | undefined;
    if (!body) throw new Error(`Empty body for key ${key}`);
    const chunks: Uint8Array[] = [];
    for await (const chunk of body) chunks.push(chunk);
    return Buffer.concat(chunks);
  }

  async putBytes(params: { key: string; body: Buffer; contentType: string }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.derivedBucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.uploadBucket, Key: key }),
    );
  }
}

function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === "NotFound" || e?.$metadata?.httpStatusCode === 404;
}
