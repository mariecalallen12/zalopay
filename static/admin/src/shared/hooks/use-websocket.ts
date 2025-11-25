// React hook for Socket.IO real-time updates
import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketClient } from '../lib/websocket';

interface UseWebSocketOptions {
  type?: string;
  enabled?: boolean;
  onMessage?: (message: { type: string; data: any; timestamp?: string }) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export function useWebSocket<T = any>(options: UseWebSocketOptions = {}) {
  const { type, enabled = true, onMessage, onError, onConnect, onDisconnect } = options;
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setConnected] = useState(false);
  const callbackRef = useRef(onMessage);

  // Update callback ref when onMessage changes
  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    const socket = websocketClient.connect('/admin', {
      onReconnect: () => {
        setConnected(true);
        onConnect?.();
      },
      onReconnectFailed: () => {
        setConnected(false);
        onError?.(new Error('Failed to reconnect to server'));
      },
    });
    
    setConnected(socket.connected);

    const unsubscribe = websocketClient.onConnectionChange((connected) => {
      setConnected(connected);
      if (connected) {
        onConnect?.();
      } else {
        onDisconnect?.();
      }
    });

    if (type) {
      const messageHandler = (update: WebSocketMessage) => {
        setData(update.data);
        if (callbackRef.current) {
          callbackRef.current(update);
        }
      };
      
      websocketClient.subscribe(type, messageHandler);

      return () => {
        unsubscribe();
        websocketClient.unsubscribe(type, messageHandler);
      };
    }

    return () => {
      unsubscribe();
    };
  }, [type, enabled, onError, onConnect, onDisconnect]);

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

/**
 * Hook for device real-time updates
 */
export function useDeviceUpdates(options: {
  enabled?: boolean;
  onDeviceConnected?: (device: any) => void;
  onDeviceDisconnected?: (device: any) => void;
  onDeviceStatusChanged?: (data: any) => void;
  onDeviceDataReceived?: (data: any) => void;
  onError?: (error: Error) => void;
} = {}) {
  const {
    enabled = true,
    onDeviceConnected,
    onDeviceDisconnected,
    onDeviceStatusChanged,
    onDeviceDataReceived,
    onError,
  } = options;

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'device:connected':
        onDeviceConnected?.(message.data);
        break;
      case 'device:disconnected':
        onDeviceDisconnected?.(message.data);
        break;
      case 'device:status-changed':
        onDeviceStatusChanged?.(message.data);
        break;
      case 'device:data-received':
        onDeviceDataReceived?.(message.data);
        break;
    }
  }, [onDeviceConnected, onDeviceDisconnected, onDeviceStatusChanged, onDeviceDataReceived]);

  return useWebSocket({
    type: 'devices',
    enabled,
    onMessage: handleMessage,
    onError,
  });
}

/**
 * Hook for activity log real-time updates
 */
export function useActivityUpdates(options: {
  enabled?: boolean;
  onActivityLogCreated?: (log: any) => void;
  onActivityNew?: (activity: any) => void;
  onError?: (error: Error) => void;
} = {}) {
  const {
    enabled = true,
    onActivityLogCreated,
    onActivityNew,
    onError,
  } = options;

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'activity:log-created':
        onActivityLogCreated?.(message.data);
        break;
      case 'activity:new':
        onActivityNew?.(message.data);
        break;
    }
  }, [onActivityLogCreated, onActivityNew]);

  return useWebSocket({
    type: 'activity',
    enabled,
    onMessage: handleMessage,
    onError,
  });
}
