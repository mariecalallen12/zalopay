// React hook for DogeRat Socket.IO real-time updates
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export interface DogeRatSocketEvents {
  'device-connected': (device: {
    id: string;
    device_id: string;
    platform: string;
    model?: string;
    version?: string;
    ip_address?: string;
    connected_at: string;
    online: boolean;
  }) => void;
  'device-disconnected': (data: { id: string; device_id: string }) => void;
  'device-data-update': (data: {
    device_id: string;
    data_type: string;
    data: any;
    captured_at: string;
  }) => void;
  'screen-frame': (data: { device_id: string; frame: string; timestamp: number }) => void;
  'control-response': (data: {
    device_id: string;
    command: any;
    success: boolean;
    timestamp: number;
  }) => void;
  'action-response': (data: {
    device_id: string;
    action: string;
    result: any;
    timestamp: number;
  }) => void;
  'file-uploaded': (data: {
    device_id: string;
    filename: string;
    url: string;
  }) => void;
}

export interface UseDogeRatSocketOptions {
  onDeviceConnected?: (device: any) => void;
  onDeviceDisconnected?: (data: { id: string }) => void;
  onDeviceDataUpdate?: (data: any) => void;
  onScreenFrame?: (data: any) => void;
  onControlResponse?: (data: any) => void;
  onActionResponse?: (data: any) => void;
  onFileUploaded?: (data: any) => void;
  enabled?: boolean;
}

export function useDogeRatSocket(options: UseDogeRatSocketOptions = {}) {
  const {
    onDeviceConnected,
    onDeviceDisconnected,
    onDeviceDataUpdate,
    onScreenFrame,
    onControlResponse,
    onActionResponse,
    onFileUploaded,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Connect to DogeRat Socket.IO server (default namespace)
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('DogeRat Socket.IO connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('DogeRat Socket.IO disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('DogeRat Socket.IO connection error:', error);
      setIsConnected(false);
    });

    // Device events
    socket.on('device-connected', (device) => {
      console.log('Device connected:', device);
      onDeviceConnected?.(device);
    });

    socket.on('device-disconnected', (data) => {
      console.log('Device disconnected:', data);
      onDeviceDisconnected?.(data);
    });

    socket.on('device-data-update', (data) => {
      console.log('Device data update:', data);
      onDeviceDataUpdate?.(data);
    });

    // Screen streaming events
    socket.on('screen-frame', (data) => {
      onScreenFrame?.(data);
    });

    // Remote control events
    socket.on('control-response', (data) => {
      onControlResponse?.(data);
    });

    // Action events
    socket.on('action-response', (data) => {
      onActionResponse?.(data);
    });

    // File upload events
    socket.on('file-uploaded', (data) => {
      onFileUploaded?.(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    enabled,
    onDeviceConnected,
    onDeviceDisconnected,
    onDeviceDataUpdate,
    onScreenFrame,
    onControlResponse,
    onActionResponse,
    onFileUploaded,
  ]);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    isConnected,
    socket: socketRef.current,
    emit,
  };
}

