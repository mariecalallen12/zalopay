// Screen control component
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dogeratAPI, ScreenQuality, ScreenStatus } from '@/shared/lib/dogerat-api';
import { useDogeRatSocket } from '@/shared/hooks/use-dogerat-socket';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { toast } from '@/shared/hooks/use-toast';
import { Monitor, Play, Square, Settings } from 'lucide-react';

interface ScreenControlProps {
  deviceId: string;
}

export function ScreenControl({ deviceId }: ScreenControlProps) {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [quality, setQuality] = useState<ScreenQuality>({
    fps: 15,
    resolution: 'half',
    compression: 75,
  });

  // Fetch screen status
  const { data: screenStatus, refetch: refetchStatus } = useQuery<ScreenStatus>({
    queryKey: ['screen-status', deviceId],
    queryFn: () => dogeratAPI.getScreenStatus(deviceId),
    refetchInterval: 2000,
  });

  const screenState = screenStatus as ScreenStatus | undefined;

  // Start streaming mutation
  const startMutation = useMutation({
    mutationFn: (quality?: ScreenQuality) => dogeratAPI.startScreenStream(deviceId, quality),
    onSuccess: () => {
      toast({
        title: 'Screen streaming started',
        description: 'Screen streaming has been initiated',
      });
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start streaming',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Stop streaming mutation
  const stopMutation = useMutation({
    mutationFn: () => dogeratAPI.stopScreenStream(deviceId),
    onSuccess: () => {
      toast({
        title: 'Screen streaming stopped',
        description: 'Screen streaming has been stopped',
      });
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to stop streaming',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update quality mutation
  const updateQualityMutation = useMutation({
    mutationFn: (quality: ScreenQuality) => dogeratAPI.updateScreenQuality(deviceId, quality),
    onSuccess: () => {
      toast({
        title: 'Quality updated',
        description: 'Screen quality settings have been updated',
      });
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update quality',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle screen frame events
  useDogeRatSocket({
    onScreenFrame: (data: { device_id: string; frame: string }) => {
      if (data.device_id === deviceId && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx && data.frame) {
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
          img.src = `data:image/jpeg;base64,${data.frame}`;
        }
      }
    },
  });

  const handleStart = () => {
    startMutation.mutate(quality);
  };

  const handleStop = () => {
    stopMutation.mutate();
  };

  const handleQualityUpdate = () => {
    updateQualityMutation.mutate(quality);
  };

  const isStreaming = screenState?.streaming || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Screen Control
        </CardTitle>
        <CardDescription>
          Stream and view device screen in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Screen Viewer */}
        <div className="border border-gray-200 rounded-lg bg-black aspect-video flex items-center justify-center">
          {isStreaming ? (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="text-gray-500 text-center">
              <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Screen streaming not active</p>
              <p className="text-sm">Click Start to begin streaming</p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-medium">Status:</span>
            <span className={`ml-2 text-sm ${isStreaming ? 'text-green-600' : 'text-gray-600'}`}>
              {isStreaming ? 'Streaming' : 'Stopped'}
            </span>
          </div>
          {screenState?.started_at && (
            <div className="text-xs text-gray-500">
              Started: {new Date(screenState.started_at).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isStreaming ? (
            <Button onClick={handleStart} disabled={startMutation.isPending} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              {startMutation.isPending ? 'Starting...' : 'Start Streaming'}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              disabled={stopMutation.isPending}
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              {stopMutation.isPending ? 'Stopping...' : 'Stop Streaming'}
            </Button>
          )}
        </div>

        {/* Quality Settings */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4" />
            <span className="font-medium text-sm">Quality Settings</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">FPS</label>
              <Input
                type="number"
                min="5"
                max="30"
                value={quality.fps || 15}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setQuality({ ...quality, fps: parseInt(e.target.value) || 15 })
                }
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Resolution</label>
              <Select
                value={quality.resolution || 'half'}
                onValueChange={(value: 'full' | 'half' | 'quarter') =>
                  setQuality({ ...quality, resolution: value })
                }
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="half">Half</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Compression</label>
              <Input
                type="number"
                min="60"
                max="90"
                value={quality.compression || 75}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setQuality({ ...quality, compression: parseInt(e.target.value) || 75 })
                }
                className="text-sm"
              />
            </div>
          </div>

          {isStreaming && (
            <Button
              onClick={handleQualityUpdate}
              disabled={updateQualityMutation.isPending}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {updateQualityMutation.isPending ? 'Updating...' : 'Update Quality'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

