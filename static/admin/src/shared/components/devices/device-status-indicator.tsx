// Device status indicator component
import React from 'react';
import { cn } from '../../lib/utils';

interface DeviceStatusIndicatorProps {
  status: 'online' | 'offline';
  platform?: 'android' | 'ios';
  className?: string;
}

export function DeviceStatusIndicator({
  status,
  platform,
  className,
}: DeviceStatusIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'online' ? 'bg-green-500' : 'bg-gray-400',
          status === 'online' && 'animate-pulse'
        )}
      />
      <span
        className={cn(
          'text-sm font-medium',
          status === 'online' ? 'text-green-700' : 'text-gray-500'
        )}
      >
        {status === 'online' ? 'Online' : 'Offline'}
      </span>
      {platform && (
        <span
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            platform === 'ios'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-green-100 text-green-700'
          )}
        >
          {platform === 'ios' ? '🍎 iOS' : '🤖 Android'}
        </span>
      )}
    </div>
  );
}

