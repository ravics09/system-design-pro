import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplicationContext } from '@nestjs/common';
import type { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { config } from './config';

/**
 * Enables horizontal scale-out of the WebSocket tier.
 *
 * With this adapter, `server.to(room).emit(...)` on ANY gateway instance is
 * broadcast (via Redis Pub/Sub) to every other instance, so a notification can
 * reach a user's socket no matter which gateway holds it. This is the mechanism
 * that lets millions of connections spread across many servers. Off by default
 * (SOCKET_ADAPTER=memory) so the app runs without Redis.
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const pubClient = new Redis(config.REDIS_URL);
    const subClient = pubClient.duplicate();
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, options);
    if (this.adapterConstructor) server.adapter(this.adapterConstructor);
    return server;
  }
}
