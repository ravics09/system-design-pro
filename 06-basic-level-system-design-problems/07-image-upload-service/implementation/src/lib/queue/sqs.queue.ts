import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { config } from "../../config/index.js";
import type { JobQueue, ReceivedJob } from "./queue.interface.js";
import type { ProcessImageJob } from "../../types/index.js";

/** SQS-backed durable queue for the async image-processing pipeline. */
export class SqsQueue implements JobQueue {
  private readonly client: SQSClient;
  private readonly queueUrl: string;

  constructor() {
    if (!config.SQS_QUEUE_URL) {
      throw new Error("SQS_QUEUE_URL must be set when QUEUE_DRIVER=sqs");
    }
    this.client = new SQSClient({ region: config.AWS_REGION });
    this.queueUrl = config.SQS_QUEUE_URL;
  }

  async publish(job: ProcessImageJob): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(job),
      }),
    );
  }

  async receive(maxMessages: number): Promise<ReceivedJob[]> {
    const res = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: Math.min(10, Math.max(1, maxMessages)),
        WaitTimeSeconds: 20, // long polling
        VisibilityTimeout: 60,
      }),
    );

    const messages = res.Messages ?? [];
    const jobs: ReceivedJob[] = [];
    for (const m of messages) {
      if (!m.Body || !m.ReceiptHandle) continue;
      let job: ProcessImageJob;
      try {
        job = JSON.parse(m.Body) as ProcessImageJob;
      } catch {
        // Malformed message: delete it so it doesn't block the queue.
        await this.deleteMessage(m.ReceiptHandle);
        continue;
      }
      const receipt = m.ReceiptHandle;
      jobs.push({ job, ack: () => this.deleteMessage(receipt) });
    }
    return jobs;
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    await this.client.send(
      new DeleteMessageCommand({ QueueUrl: this.queueUrl, ReceiptHandle: receiptHandle }),
    );
  }
}
