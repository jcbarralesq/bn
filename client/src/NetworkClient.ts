import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@battle-navy/shared';

type ServerEvent = keyof ServerToClientEvents;
type ServerPayload<E extends ServerEvent> = Parameters<ServerToClientEvents[E]>[0];

export class NetworkClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;

  constructor() {
    this.socket = io();
  }

  connect(): void {
    this.socket.connect();
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  on<E extends ServerEvent>(event: E, handler: ServerToClientEvents[E]): void {
    this.socket.on(event, handler as never);
  }

  off<E extends ServerEvent>(event: E): void {
    this.socket.off(event);
  }

  emit<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ): void {
    (this.socket.emit as any)(event, ...args);
  }

  get id(): string | undefined {
    return this.socket.id;
  }
}
