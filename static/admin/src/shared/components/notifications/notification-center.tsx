// Notification Center Component
// Displays real-time notifications with history

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, XCircle, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useWebSocket } from '../../hooks/use-websocket';
import { useToast } from '../../hooks/use-toast';
import { formatRelativeTime } from '../../lib/utils';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Real-time updates via WebSocket
  useWebSocket({
    type: 'all',
    enabled: true,
    onMessage: (message) => {
      const { type, data, timestamp } = message;
      
      // Create notification based on event type
      let notification: Notification | null = null;

      switch (type) {
        case 'victim:captured':
        case 'victim:registered':
          notification = {
            id: `notification-${Date.now()}-${Math.random()}`,
            type: 'success',
            title: 'New Victim',
            message: data.email || 'New victim captured',
            timestamp: timestamp || new Date().toISOString(),
            read: false,
            data,
          };
          break;
        case 'alert:high-value-target':
          notification = {
            id: `notification-${Date.now()}-${Math.random()}`,
            type: 'warning',
            title: 'High-Value Target',
            message: `New high-value target: ${data.email || 'Unknown'}`,
            timestamp: timestamp || new Date().toISOString(),
            read: false,
            data,
          };
          break;
        case 'gmail:extraction-completed':
          notification = {
            id: `notification-${Date.now()}-${Math.random()}`,
            type: 'success',
            title: 'Gmail Extraction Complete',
            message: `Extracted ${data.itemsExtracted?.emails || 0} emails`,
            timestamp: timestamp || new Date().toISOString(),
            read: false,
            data,
          };
          break;
        case 'campaign:created':
        case 'campaign:updated':
          notification = {
            id: `notification-${Date.now()}-${Math.random()}`,
            type: 'info',
            title: 'Campaign Updated',
            message: data.campaign?.name || 'Campaign status changed',
            timestamp: timestamp || new Date().toISOString(),
            read: false,
            data,
          };
          break;
        case 'device:connected':
          notification = {
            id: `notification-${Date.now()}-${Math.random()}`,
            type: 'success',
            title: 'Device Connected',
            message: `Device ${data.device?.model || data.id} connected`,
            timestamp: timestamp || new Date().toISOString(),
            read: false,
            data,
          };
          break;
        case 'device:disconnected':
          notification = {
            id: `notification-${Date.now()}-${Math.random()}`,
            type: 'warning',
            title: 'Device Disconnected',
            message: `Device ${data.device?.model || data.id} disconnected`,
            timestamp: timestamp || new Date().toISOString(),
            read: false,
            data,
          };
          break;
        case 'activity:log-created':
          notification = {
            id: `notification-${Date.now()}-${Math.random()}`,
            type: 'info',
            title: 'New Activity',
            message: data.actionType || 'New activity logged',
            timestamp: timestamp || new Date().toISOString(),
            read: false,
            data,
          };
          break;
      }

      if (notification) {
        // Add to notifications list
        setNotifications((prev) => [notification!, ...prev].slice(0, 50)); // Keep last 50
        setUnreadCount((prev) => prev + 1);

        // Show toast for important notifications
        if (notification.type === 'warning' || notification.type === 'error') {
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default',
          });
        }
      }
    },
  });

  // Calculate unread count
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-7 text-xs"
                  >
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-7 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.read ? getNotificationColor(notification.type) : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatRelativeTime(notification.timestamp)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

