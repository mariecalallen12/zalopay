// Action execution panel component
import { useState, ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dogeratAPI, Action } from '@/shared/lib/dogerat-api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toast } from '@/shared/hooks/use-toast';

interface ActionPanelProps {
  deviceId: string;
  platform: 'android' | 'ios';
}

export function ActionPanel({ deviceId, platform }: ActionPanelProps) {
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [actionParams, setActionParams] = useState<Record<string, any>>({});
  const [actionResult, setActionResult] = useState<any>(null);

  // Fetch available actions
  const { data: actions = [], isLoading: loadingActions } = useQuery<Action[]>({
    queryKey: ['actions', platform],
    queryFn: () => dogeratAPI.getAvailableActions(platform),
  });

  // Filter actions by platform
  const availableActions = actions.filter((action) => {
    if (!action.platform) return true;
    return action.platform === platform || action.platform === 'both';
  });

  // Execute action mutation
  const executeMutation = useMutation({
    mutationFn: ({ action, params }: { action: string; params?: Record<string, any> }) =>
      dogeratAPI.executeAction(deviceId, action, params),
    onSuccess: (data) => {
      setActionResult(data);
      toast({
        title: 'Action executed',
        description: `Action "${selectedAction}" executed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['device', deviceId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Action failed',
        description: error.message,
        variant: 'destructive',
      });
      setActionResult({ error: error.message });
    },
  });

  const handleExecute = () => {
    if (!selectedAction) return;
    setActionResult(null);
    executeMutation.mutate({
      action: selectedAction,
      params: Object.keys(actionParams).length > 0 ? actionParams : undefined,
    });
  };

  const handleParamChange = (key: string, value: any) => {
    setActionParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getActionParams = (actionName: string): Record<string, any> => {
    const action = availableActions.find((a) => a.name === actionName);
    return action?.params || {};
  };

  const selectedActionData = availableActions.find((a) => a.name === selectedAction);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execute Actions</CardTitle>
        <CardDescription>
          Execute actions on this device. Actions are platform-aware.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Action
          </label>
          <Select value={selectedAction} onValueChange={(value: string) => {
            setSelectedAction(value);
            setActionParams({});
            setActionResult(null);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an action..." />
            </SelectTrigger>
            <SelectContent>
              {loadingActions ? (
                <SelectItem value="loading" disabled>Loading actions...</SelectItem>
              ) : availableActions.length === 0 ? (
                <SelectItem value="none" disabled>No actions available</SelectItem>
              ) : (
                availableActions.map((action) => (
                  <SelectItem key={action.name} value={action.name}>
                    {action.name}
                    {action.description && ` - ${action.description}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Action Parameters */}
        {selectedAction && selectedActionData && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Parameters
            </label>
            {selectedAction === 'toast' && (
              <Input
                placeholder="Message"
                value={actionParams.message || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleParamChange('message', e.target.value)}
              />
            )}
            {selectedAction === 'send_sms' && (
              <div className="space-y-2">
                <Input
                  placeholder="Phone number"
                  value={actionParams.phone || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleParamChange('phone', e.target.value)}
                />
                <Input
                  placeholder="Message"
                  value={actionParams.message || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleParamChange('message', e.target.value)}
                />
              </div>
            )}
            {selectedAction === 'open_url' && (
              <Input
                placeholder="URL"
                value={actionParams.url || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleParamChange('url', e.target.value)}
              />
            )}
            {selectedAction === 'capture_camera' && (
              <Select
                value={actionParams.camera || 'main'}
                onValueChange={(value: string) => handleParamChange('camera', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Camera</SelectItem>
                  <SelectItem value="selfie">Selfie Camera</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={!selectedAction || executeMutation.isPending}
          className="w-full"
        >
          {executeMutation.isPending ? 'Executing...' : 'Execute Action'}
        </Button>

        {/* Action Result */}
        {actionResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Result:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(actionResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Available Actions List */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium mb-2">Available Actions ({availableActions.length})</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {availableActions.map((action) => (
              <div
                key={action.name}
                className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedAction(action.name)}
              >
                <div className="font-medium">{action.name}</div>
                {action.description && (
                  <div className="text-xs text-gray-600">{action.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

