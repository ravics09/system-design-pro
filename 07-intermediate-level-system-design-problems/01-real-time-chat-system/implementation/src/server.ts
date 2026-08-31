import http from 'node:http';
import path from 'node:path';
import express from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { config } from './config';
import { Message } from './models';
import { nextMessageId } from './lib/ids';
import { signToken, verifyToken } from './lib/token';

async function main() {
  await mongoose.connect(config.mongoUri);

  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Demo: mint a token for a userId (replace with real auth in production).
  app.get('/api/token', (req, res) => {
    const userId = String(req.query.userId ?? '').trim();
    if (!userId) return res.status(400).json({ error: 'userId required' });
    res.json({ userId, token: signToken(userId) });
  });

  // Cursor-paginated history (newest-first). `before` is a messageId cursor.
  app.get('/api/conversations/:id/messages', async (req, res) => {
    const conversationId = req.params.id;
    const limit = Math.min(100, Number(req.query.limit ?? 50));
    const before = req.query.before ? String(req.query.before) : null;
    const query: Record<string, unknown> = { conversationId };
    if (before) query.messageId = { $lt: before };
    const items = await Message.find(query).sort({ messageId: -1 }).limit(limit).lean();
    res.json({
      items: items.reverse(),
      nextCursor: items.length === limit ? items[0]?.messageId ?? null : null,
    });
  });

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: config.corsOrigin } });

  // Redis adapter → messages emitted on one node reach sockets on every node.
  const pubClient = new Redis(config.redisUrl);
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // Authenticate the handshake once (not per message).
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    const userId = token && verifyToken(token);
    if (!userId) return next(new Error('unauthorized'));
    (socket.data as { userId: string }).userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    const userId = (socket.data as { userId: string }).userId;

    socket.on('join', (conversationId: string) => {
      void socket.join(`conv:${conversationId}`);
    });

    // At-least-once + idempotency: retries carry the same clientMsgId → deduped by
    // the unique index; recipients also dedup by messageId.
    socket.on('message', async (payload: { conversationId: string; clientMsgId: string; body: string }, ack?: (r: unknown) => void) => {
      try {
        const { conversationId, clientMsgId, body } = payload ?? ({} as typeof payload);
        if (!conversationId || !clientMsgId || !body) throw new Error('invalid payload');
        const messageId = nextMessageId();
        let doc;
        try {
          doc = await Message.create({ messageId, conversationId, senderId: userId, clientMsgId, body });
        } catch (err) {
          if ((err as { code?: number }).code === 11000) {
            doc = await Message.findOne({ conversationId, clientMsgId }).lean(); // idempotent replay
          } else {
            throw err;
          }
        }
        const out = {
          messageId: doc!.messageId,
          conversationId,
          senderId: userId,
          clientMsgId,
          body,
          createdAt: (doc as { createdAt?: Date }).createdAt ?? new Date(),
        };
        io.to(`conv:${conversationId}`).emit('message', out); // fan-out across nodes via Redis
        ack?.({ ok: true, messageId: out.messageId });
      } catch (err) {
        ack?.({ ok: false, error: (err as Error).message });
      }
    });

    socket.on('typing', (conversationId: string) => {
      // Ephemeral, never persisted.
      socket.to(`conv:${conversationId}`).emit('typing', { userId, conversationId });
    });
  });

  server.listen(config.port, () => console.log(`[chat] listening on :${config.port}`));
}

main().catch((err) => {
  console.error('fatal', err);
  process.exit(1);
});
