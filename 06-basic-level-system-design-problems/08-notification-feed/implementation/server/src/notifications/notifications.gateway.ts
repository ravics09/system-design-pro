import {
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { config, userRoom } from '../config';

/**
 * The connection tier. Each socket authenticates on the handshake and joins the
 * room `user:<id>`. Delivery is one-directional (server → client) via
 * `emitToUser`, so the service depends on the gateway (no circular DI).
 *
 * With the Redis adapter enabled (see main.ts), `server.to(room).emit(...)` is
 * broadcast across ALL gateway instances, so a worker on any node reaches a
 * user's socket wherever it lives — the key to horizontal scale.
 */
@WebSocketGateway({ cors: { origin: config.CORS_ORIGIN } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() private server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  /** presence: userId → number of open sockets (multiple tabs/devices). */
  private readonly presence = new Map<string, number>();

  handleConnection(client: Socket): void {
    // Demo auth: the handshake carries the userId as a token. In production this
    // is a JWT verified here; the room is ALWAYS derived from the authenticated
    // id, never a client-supplied channel.
    const raw = client.handshake.auth?.token ?? client.handshake.query?.userId;
    const userId = Array.isArray(raw) ? raw[0] : raw;
    if (!userId || typeof userId !== 'string') {
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;
    void client.join(userRoom(userId));
    this.presence.set(userId, (this.presence.get(userId) ?? 0) + 1);
    this.logger.debug(`connected ${userId} (${this.presence.get(userId)} sockets)`);

    client.emit('connected', { userId });
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId as string | undefined;
    if (!userId) return;
    const next = (this.presence.get(userId) ?? 1) - 1;
    if (next <= 0) this.presence.delete(userId);
    else this.presence.set(userId, next);
  }

  /** Push an event to every socket a user has open (across instances via the adapter). */
  emitToUser(userId: string, event: string, data: unknown): void {
    this.server.to(userRoom(userId)).emit(event, data);
  }

  isOnline(userId: string): boolean {
    return (this.presence.get(userId) ?? 0) > 0;
  }
}
