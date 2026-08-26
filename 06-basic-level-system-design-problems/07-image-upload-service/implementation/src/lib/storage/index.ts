import type { StorageProvider } from "./storage.interface.js";
import { S3StorageProvider } from "./s3.storage.js";

let instance: StorageProvider | null = null;

/** Singleton storage provider. Swap the implementation here if needed. */
export function getStorage(): StorageProvider {
  if (!instance) instance = new S3StorageProvider();
  return instance;
}

export type { StorageProvider } from "./storage.interface.js";
