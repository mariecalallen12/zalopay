// Device management component
// Lists and manages devices connected via DogeRat API

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dogeratAPI, Device } from '../../shared/lib/dogerat-api';
import { useDogeRatSocket } from '../../shared/hooks/use-dogerat-socket';
import { DeviceStatusIndicator } from '../../shared/components/devices/device-status-indicator';
import { Search, Filter, Smartphone } from 'lucide-react';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../shared/components/ui/select';

export function Devices() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Filters
  const [platformFilter, setPlatformFilter] = useState<'all' | 'android' | 'ios'>('all');
  const [onlineFilter, setOnlineFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'last_seen' | 'connected_at' | 'model'>('last_seen');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Build filters for API
  const apiFilters = useMemo(() => {
    const filters: { platform?: 'android' | 'ios'; online?: boolean } = {};
    if (platformFilter !== 'all') {
      filters.platform = platformFilter;
    }
    if (onlineFilter !== 'all') {
      filters.online = onlineFilter === 'online';
    }
    return filters;
  }, [platformFilter, onlineFilter]);

  // Fetch devices
  const {
    data: devicesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['devices', apiFilters],
    queryFn: () => dogeratAPI.getDevices(apiFilters),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const devices = devicesResponse || [];

  // Real-time Socket.IO updates
  useDogeRatSocket({
    onDeviceConnected: (device) => {
      // Invalidate and refetch devices
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
    onDeviceDisconnected: (data) => {
      // Update device status in cache
      queryClient.setQueryData(['devices', apiFilters], (old: Device[] | undefined) => {
        if (!old) return old;
        return old.map((d) =>
          d.id === data.id ? { ...d, status: 'offline' as const } : d
        );
      });
    },
    onDeviceDataUpdate: () => {
      // Optionally refetch device details if needed
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  // Filter and sort devices client-side
  const filteredAndSortedDevices = useMemo(() => {
    let result = [...devices];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (device) =>
          device.model?.toLowerCase().includes(query) ||
          device.device_id?.toLowerCase().includes(query) ||
          device.ip_address?.toLowerCase().includes(query) ||
          device.version?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'last_seen':
          aValue = new Date(a.last_seen).getTime();
          bValue = new Date(b.last_seen).getTime();
          break;
        case 'connected_at':
          aValue = new Date(a.connected_at).getTime();
          bValue = new Date(b.connected_at).getTime();
          break;
        case 'model':
          aValue = a.model || '';
          bValue = b.model || '';
          break;
        default:
          return 0;
      }

      if (sortBy === 'model') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [devices, searchQuery, sortBy, sortOrder]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getConnectionDuration = (connectedAt: string) => {
    const now = new Date();
    const connected = new Date(connectedAt);
    const diff = now.getTime() - connected.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading devices: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and monitor devices connected via DogeRat API
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DeviceStatusIndicator status="online" />
          <span className="text-sm text-gray-600">
            {filteredAndSortedDevices.length} device{filteredAndSortedDevices.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Platform Filter */}
          <Select value={platformFilter} onValueChange={(v: any) => setPlatformFilter(v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="android">Android</SelectItem>
              <SelectItem value="ios">iOS</SelectItem>
            </SelectContent>
          </Select>

          {/* Online Status Filter */}
          <Select value={onlineFilter} onValueChange={(v: any) => setOnlineFilter(v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
            const [field, order] = v.split('-');
            setSortBy(field as any);
            setSortOrder(order as 'asc' | 'desc');
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_seen-desc">Last Seen (Newest)</SelectItem>
              <SelectItem value="last_seen-asc">Last Seen (Oldest)</SelectItem>
              <SelectItem value="connected_at-desc">Connected (Newest)</SelectItem>
              <SelectItem value="connected_at-asc">Connected (Oldest)</SelectItem>
              <SelectItem value="model-asc">Model (A-Z)</SelectItem>
              <SelectItem value="model-desc">Model (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Device List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredAndSortedDevices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No devices found</p>
          {searchQuery || platformFilter !== 'all' || onlineFilter !== 'all' ? (
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              Devices will appear here when connected
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedDevices.map((device) => (
            <div
              key={device.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setLocation(`/devices/${device.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {device.model || device.device_id || 'Unknown Device'}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {device.device_id?.substring(0, 12)}...
                  </p>
                </div>
                <DeviceStatusIndicator
                  status={device.status}
                  platform={device.platform as 'android' | 'ios'}
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform:</span>
                  <span className="font-medium">
                    {device.platform?.toUpperCase() || 'N/A'}
                    {device.platform_version && ` ${device.platform_version}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">{device.version || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IP Address:</span>
                  <span className="font-medium font-mono text-xs">
                    {device.ip_address || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connected:</span>
                  <span className="font-medium">
                    {formatDate(device.connected_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {getConnectionDuration(device.connected_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Seen:</span>
                  <span className="font-medium">
                    {formatDate(device.last_seen)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(`/devices/${device.id}`);
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
