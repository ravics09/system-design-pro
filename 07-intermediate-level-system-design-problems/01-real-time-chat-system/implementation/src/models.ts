import { Schema, model } from 'mongoose';

/**
 * A chat message. `messageId` is a server-assigned sortable id (see lib/ids.ts) so a
 * conversation's history has a stable, monotonic order. `clientMsgId` is unique per
 * conversation to make sends idempotent (safe retries → no duplicates).
 */
const messageSchema = new Schema(
  {
    messageId: { type: String, required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    clientMsgId: { type: String, required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

// One message per (conversation, clientMsgId) → idempotent delivery.
messageSchema.index({ conversationId: 1, clientMsgId: 1 }, { unique: true });
// Efficient "history newest-first, paginated by cursor".
messageSchema.index({ conversationId: 1, messageId: -1 });

export const Message = model('Message', messageSchema);
