// React hook for Socket.IO real-time updates
import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketClient } from '../lib/websocket';

interface UseWebSocketOptions {
  type?: string;
  enabled?: boolean;
  onMessage?: (message: { type: string; data: any }) => void;
  onError?: (error: Error) => void;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export function useWebSocket<T = any>(options: UseWebSocketOptions = {}) {
  const { type, enabled = true, onMessage, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setConnected] = useState(false);
  const callbackRef = useRef(onMessage);

  // Update callback ref when onMessage changes
  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    const socket = websocketClient.connect();
    
    setConnected(socket.connected);

    const handleConnect = () => {
      setConnected(true);
      console.log('Socket.IO connected to admin namespace');
    };
    
    const handleDisconnect = () => {
      setConnected(false);
      console.log('Socket.IO disconnected from admin namespace');
    };

    const handleError = (error: Error) => {
      console.error('Socket.IO error:', error);
      onError?.(error);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    if (type) {
      const messageHandler = (update: WebSocketMessage) => {
        setData(update.data);
        if (callbackRef.current) {
          callbackRef.current(update);
        }
      };
      
      websocketClient.subscribe(type, messageHandler);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
      if (type) {
        websocketClient.unsubscribe();
      }
    };
  }, [type, enabled, onError]);

  const emit = useCallback((event: string, data: any) => {
    const socket = websocketClient.getSocket();
    socket?.emit(event, data);
  }, []);

  return {
    data,
    isConnected,
    emit,
  };
}
