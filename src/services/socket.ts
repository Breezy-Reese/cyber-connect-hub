import { io, Socket } from 'socket.io-client';

export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  'notification:new_request': (data: any) => void;
  'notification:time_added': (data: { minutes: number; newRemainingTime: number }) => void;
  'notification:request_rejected': (data: { request: any; response: string }) => void;
  'notification:print_approved': (data: { request: any; printJob: any }) => void;
  'session:ended': (data: any) => void;
  'computer:locked': (data: { computerId: string }) => void;
  'message:received': (data: any) => void;
  'initial:session': (data: any) => void;
  'initial:messages': (data: any[]) => void;
  'initial:requests': (data: any[]) => void;
  'initial:balance': (data: { balance: number }) => void;
  'admin:active_sessions': (data: any[]) => void;
  'admin:pending_requests': (data: any[]) => void;
  'admin:clients': (data: any[]) => void;
  'admin:computers': (data: any[]) => void;
  'admin:recent_activities': (data: any[]) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'request:service': (data: { type: string; details: any }) => void;
  'request:time_extension': (data: { minutes: number }) => void;
  'request:print': (data: { fileName: string; copies: number; color?: boolean; pages?: number; fileData?: any }) => void;
  'message:send': (data: { receiverId: string; message: string }) => void;
  'admin:approve_request': (data: { requestId: string; response?: string }) => void;
  'admin:reject_request': (data: { requestId: string; response?: string }) => void;
  'admin:end_session': (data: { sessionId: string }) => void;
  'admin:lock_computer': (data: { computerId: string; sessionId: string }) => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

   const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<K extends keyof ServerToClientEvents>(
    event: K,
    callback: ServerToClientEvents[K]
  ): void {
    if (!this.socket) return;

    // Store callback for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as Function);

    this.socket.on(event, callback as any);
  }

  off<K extends keyof ServerToClientEvents>(
    event: K,
    callback?: ServerToClientEvents[K]
  ): void {
    if (!this.socket) return;

    if (callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback as Function);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
      this.socket.off(event, callback as any);
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  emit<K extends keyof ClientToServerEvents>(
    event: K,
    data: Parameters<ClientToServerEvents[K]>[0]
  ): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected');
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();