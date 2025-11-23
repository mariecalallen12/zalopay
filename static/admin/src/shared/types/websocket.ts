// WebSocket/Socket.IO types

export interface SocketUpdate {
  type: 'victims' | 'campaigns' | 'gmail' | 'activity' | 'all';
  data: any;
  timestamp: string;
}

export interface SocketSubscribe {
  type: string;
  filters?: Record<string, any>;
}

