// Remote control component
import { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dogeratAPI, ControlCommand, ControlStatus } from '@/shared/lib/dogerat-api';
import { useDogeRatSocket } from '@/shared/hooks/use-dogerat-socket';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { toast } from '@/shared/hooks/use-toast';
import { MousePointer2, Play, Square, Keyboard, ArrowUp, ArrowDown } from 'lucide-react';

interface RemoteControlProps {
  deviceId: string;
}

export function RemoteControl({ deviceId }: RemoteControlProps) {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  // Fetch control status
  const { data: controlStatus, refetch: refetchStatus } = useQuery<ControlStatus>({
    queryKey: ['control-status', deviceId],
    queryFn: () => dogeratAPI.getControlStatus(deviceId),
    refetchInterval: 2000,
  });

  const status = controlStatus as ControlStatus | undefined;

  // Start control mutation
  const startMutation = useMutation({
    mutationFn: () => dogeratAPI.startRemoteControl(deviceId),
    onSuccess: () => {
      toast({
        title: 'Remote control started',
        description: 'Remote control session has been initiated',
      });
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start remote control',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Stop control mutation
  const stopMutation = useMutation({
    mutationFn: () => dogeratAPI.stopRemoteControl(deviceId),
    onSuccess: () => {
      toast({
        title: 'Remote control stopped',
        description: 'Remote control session has been stopped',
      });
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to stop remote control',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send command mutation
  const sendCommandMutation = useMutation({
    mutationFn: (command: ControlCommand) => dogeratAPI.sendControlCommand(deviceId, command),
    onError: (error: Error) => {
      toast({
        title: 'Command failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle control responses
  useDogeRatSocket({
    onControlResponse: (data: { device_id: string; success: boolean }) => {
      if (data.device_id === deviceId) {
        if (!data.success) {
          toast({
            title: 'Command failed',
            description: 'Device rejected the command',
            variant: 'destructive',
          });
        }
      }
    },
  });

  const handleStart = () => {
    startMutation.mutate();
  };

  const handleStop = () => {
    stopMutation.mutate();
  };

  const sendTouch = (x: number, y: number) => {
    if (!status?.active) return;
    sendCommandMutation.mutate({
      type: 'touch',
      data: { x, y },
    });
  };

  const sendSwipe = (x1: number, y1: number, x2: number, y2: number) => {
    if (!status?.active) return;
    sendCommandMutation.mutate({
      type: 'swipe',
      data: { x1, y1, x2, y2 },
    });
  };

  const sendKey = (key: string) => {
    if (!status?.active) return;
    sendCommandMutation.mutate({
      type: 'key',
      data: { key },
    });
  };

  const sendScroll = (direction: 'up' | 'down' | 'left' | 'right', distance: number = 100) => {
    if (!status?.active) return;
    sendCommandMutation.mutate({
      type: 'scroll',
      data: { direction, distance },
    });
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set default canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Canvas touch/click handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !status?.active) return;

    const getCanvasCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height,
      };
    };

    let startPos: { x: number; y: number } | null = null;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const pos = getCanvasCoordinates(e);
      startPos = pos;
      setIsDrawing(true);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing || !startPos) return;
      e.preventDefault();
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (!startPos) return;
      e.preventDefault();
      const endPos = getCanvasCoordinates(e);
      
      const distance = Math.sqrt(
        Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
      );

      if (distance < 10) {
        // Touch
        sendTouch(startPos.x, startPos.y);
      } else {
        // Swipe
        sendSwipe(startPos.x, startPos.y, endPos.x, endPos.y);
      }

      startPos = null;
      setIsDrawing(false);
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('touchend', handleEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, [status?.active, isDrawing]);

  const isActive = status?.active || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MousePointer2 className="h-5 w-5" />
          Remote Control
        </CardTitle>
        <CardDescription>
          Control device remotely with touch, swipe, key, and scroll commands
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Control Canvas */}
        <div className="border border-gray-200 rounded-lg bg-gray-100 aspect-video flex items-center justify-center">
          {isActive ? (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full bg-white cursor-crosshair"
              style={{ touchAction: 'none' }}
            />
          ) : (
            <div className="text-gray-500 text-center">
              <MousePointer2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Remote control not active</p>
              <p className="text-sm">Click Start to begin remote control</p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm font-medium">Status:</span>
            <span className={`ml-2 text-sm ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {status?.command_count !== undefined && (
            <div className="text-xs text-gray-500">
              Commands: {status.command_count}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isActive ? (
            <Button onClick={handleStart} disabled={startMutation.isPending} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              {startMutation.isPending ? 'Starting...' : 'Start Remote Control'}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              disabled={stopMutation.isPending}
              variant="destructive"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              {stopMutation.isPending ? 'Stopping...' : 'Stop Remote Control'}
            </Button>
          )}
        </div>

        {/* Key Input */}
        {isActive && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="h-4 w-4" />
              <span className="font-medium text-sm">Send Key</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter key (e.g., Enter, Back, Home)"
                value={keyInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setKeyInput(e.target.value)}
                onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    sendKey(keyInput || e.key);
                    setKeyInput('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (keyInput) {
                    sendKey(keyInput);
                    setKeyInput('');
                  }
                }}
                size="sm"
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {/* Scroll Controls */}
        {isActive && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUp className="h-4 w-4" />
              <span className="font-medium text-sm">Scroll</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendScroll('up')}
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                Up
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendScroll('down')}
              >
                <ArrowDown className="h-4 w-4 mr-1" />
                Down
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendScroll('left')}
              >
                ← Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendScroll('right')}
              >
                Right →
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {isActive && (
          <div className="border-t pt-4">
            <p className="text-xs text-gray-600">
              <strong>Instructions:</strong> Click/tap on the canvas to send touch commands.
              Drag to swipe. Use the key input to send keyboard commands.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

