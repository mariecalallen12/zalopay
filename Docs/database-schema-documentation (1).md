# ZaloPay Merchant Phishing Platform - Database Schema Documentation

## Comprehensive Database Architecture

### Database Technology Stack
- **Primary Database**: PostgreSQL 15+ (Relational database với JSONB support)
- **Connection Pooling**: Prisma (PostgreSQL ORM with connection pooling for Express.js)
- **Backup Storage**: Encrypted file storage (Local hoặc cloud-based)

### Database Design Philosophy

The database architecture follows **Relational Model với JSONB Hybrid** approach để ensure:
- **Scalability**: Vertical scaling với connection pooling và query optimization
- **Performance**: Optimized queries với strategic indexing (including GIN indexes for JSONB)
- **Security**: Comprehensive encryption at rest và in transit, field-level encryption for sensitive data
- **Auditability**: Complete audit trail cho all operations với foreign key relationships
- **Flexibility**: JSONB columns cho nested/complex data while maintaining relational integrity
- **Replit Compatibility**: Single-database architecture optimized for Replit environment

## Core Tables Schema

### 1. Victims Table
**Purpose**: Primary storage for captured victim credentials và metadata
**Estimated Size**: 10GB+ (depending on campaign volume)
**Indexing Strategy**: Indexes on email, capture_timestamp, market_value, và GIN indexes on JSONB columns

```sql
-- Table: victims
CREATE TABLE victims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic victim information
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    password_hash VARCHAR(255),
    
    -- Capture metadata
    capture_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    campaign_id UUID REFERENCES campaigns(id),
    capture_method VARCHAR(50) NOT NULL, -- oauth_google, oauth_apple, form_direct
    capture_source VARCHAR(255),
    
    -- Session information (stored as JSONB for flexibility)
    session_data JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "session_id": "session_20251004_153025_abc123",
    --   "ip_address": "192.168.1.100",
    --   "proxy_used": {
    --     "proxy_url": "socks5://vietnam-residential-01.proxy.com:1080",
    --     "proxy_type": "residential",
    --     "country": "VN",
    --     "provider": "ProxyProvider123"
    --   },
    --   "user_agent": "Mozilla/5.0...",
    --   "referrer": "https://www.google.com/search?q=zalopay+merchant+registration",
    --   "utm_parameters": {
    --     "utm_source": "google",
    --     "utm_medium": "cpc",
    --     "utm_campaign": "zalopay_merchant_q4_2025",
    --     "utm_content": "business_registration"
    --   }
    -- }
    
    -- Device fingerprinting data (JSONB)
    device_fingerprint JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "fingerprint_id": "fp_abc123def456ghi789",
    --   "screen_resolution": "1920x1080",
    --   "color_depth": 24,
    --   "timezone": "Asia/Ho_Chi_Minh",
    --   "language": "vi-VN,vi;q=0.9,en;q=0.8",
    --   "platform": "Win32",
    --   "plugins": ["Chrome PDF Plugin", "Widevine Content Decryption Module"],
    --   "fonts": ["Arial", "Times New Roman", "Helvetica"],
    --   "canvas_signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    --   "webgl_vendor": "Intel Inc.",
    --   "webgl_renderer": "Intel(R) HD Graphics 620",
    --   "audio_fingerprint": "44100:2:f32:0.1234567890",
    --   "webrtc_ips": ["192.168.1.100", "10.0.0.150"]
    -- }
    
    -- Validation results (JSONB)
    validation JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "status": "validated", -- pending, validating, validated, invalid, expired
    --   "validation_timestamp": "2025-10-04T15:35:10.234Z",
    --   "validation_method": "oauth_token_test",
    --   "account_type": "business", -- personal, business, enterprise
    --   "market_value": "high", -- low, medium, high, critical
    --   "confidence_score": 0.92,
    --   "google_account_info": {...},
    --   "business_indicators": {...},
    --   "data_richness": {...}
    -- }
    
    -- Exploitation tracking (JSONB)
    exploitation_history JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "first_exploitation": "2025-10-04T15:40:30.567Z",
    --   "last_exploitation": "2025-10-04T16:25:45.890Z",
    --   "exploitation_count": 3,
    --   "successful_exploitations": 3,
    --   "gmail_accessed": true,
    --   "data_extracted": true
    -- }
    
    -- Risk assessment (JSONB)
    risk_assessment JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "detection_probability": 0.15,
    --   "law_enforcement_risk": "low",
    --   "technical_sophistication": "medium",
    --   "security_awareness_level": "low",
    --   "countermeasure_likelihood": 0.25
    -- }
    
    -- Payment card information (JSONB, encrypted at application level)
    card_information JSONB NOT NULL DEFAULT '{}',
    -- Example structure (encrypted values):
    -- {
    --   "card_type": "visa", -- visa, mastercard, jcb
    --   "card_number": "ENCRYPTED_CARD_NUMBER",
    --   "card_holder_name": "ENCRYPTED_CARD_HOLDER_NAME",
    --   "expiry_date": "ENCRYPTED_EXPIRY_DATE", -- MM/YY format
    --   "cvv": "ENCRYPTED_CVV",
    --   "card_image_file_path": "/secure/storage/card_images/victim_id_card.jpg",
    --   "card_image_uploaded_at": "2025-10-04T16:30:00.000Z"
    -- }
    
    -- Identity verification documents (JSONB)
    -- Step 7: Xác minh định danh người đại diện
    -- Purpose: Verify identity and prove cash flow for tax reporting purposes
    identity_verification JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "card_image_file_path": "/secure/storage/identity/card_image_victim_id.jpg",
    --   "card_image_uploaded_at": "2025-10-04T16:30:00.000Z",
    --   "card_image_requirement_explanation": {
    --     "requirement": "Hình ảnh hai mặt của thẻ Visa/Mastercard/JCB, hoặc hình ảnh hiển thị toàn bộ thông tin thẻ trên app ngân hàng để chứng minh thẻ chính xác với người đăng ký",
    --     "reason": "Xác minh và bổ sung dữ liệu để sau khi hoàn tất hợp đồng, nhà nước có căn cứ đối chiếu các bên và phân biệt được dòng tiền là doanh thu trong hoạt động kinh doanh của cá nhân hoặc hộ kinh doanh"
    --   },
    --   "transaction_history_files": [
    --     {
    --       "file_path": "/secure/storage/identity/transaction_history_1_victim_id.pdf",
    --       "file_name": "sao_ke_thang_10_2025.pdf",
    --       "file_size_bytes": 2456789,
    --       "uploaded_at": "2025-10-04T16:31:00.000Z"
    --     }
    --   ],
    --   "transaction_history_requirement_explanation": {
    --     "requirement": "Hình ảnh lịch sử giao dịch thông báo số dư hoặc hình ảnh sao kê lịch sử giao dịch gần nhất của thẻ",
    --     "reason": "Dữ liệu chứng minh về dòng tiền của cá nhân chủ hộ kinh doanh, để đơn vị ZaloPay đối chiếu với ngân hàng và cơ quan quản lý thuế trong việc làm hồ sơ. Yêu cầu đơn vị ZaloPay sẽ là đơn vị đối tác chịu trách nhiệm xử lý thuế và là đơn vị thu hộ chịu trách nhiệm báo cáo và đóng thuế của cá nhân hoặc hộ kinh doanh với cơ quan thuế đang chịu trách nhiệm quản lý cá nhân và hộ kinh doanh"
    --   },
    --   "verification_status": "pending", -- pending, verified, rejected
    --   "verification_timestamp": null,
    --   "verification_notes": null
    -- }
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete support
    deleted_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for victims table
CREATE UNIQUE INDEX idx_victims_email ON victims(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_victims_capture_timestamp ON victims(capture_timestamp DESC);
CREATE INDEX idx_victims_campaign_id ON victims(campaign_id, capture_timestamp DESC);
CREATE INDEX idx_victims_is_active ON victims(is_active) WHERE is_active = TRUE;

-- GIN indexes for JSONB columns (enables fast queries on nested data)
CREATE INDEX idx_victims_session_data ON victims USING GIN(session_data);
CREATE INDEX idx_victims_device_fingerprint ON victims USING GIN(device_fingerprint);
CREATE INDEX idx_victims_validation ON victims USING GIN(validation);
CREATE INDEX idx_victims_risk_assessment ON victims USING GIN(risk_assessment);
CREATE INDEX idx_victims_card_information ON victims USING GIN(card_information);
CREATE INDEX idx_victims_identity_verification ON victims USING GIN(identity_verification);

-- Indexes on specific JSONB paths for common queries
CREATE INDEX idx_victims_validation_status ON victims((validation->>'status'));
CREATE INDEX idx_victims_validation_market_value ON victims((validation->>'market_value'));
CREATE INDEX idx_victims_validation_account_type ON victims((validation->>'account_type'));
CREATE INDEX idx_victims_session_ip ON victims((session_data->>'ip_address'));
CREATE INDEX idx_victims_fingerprint_id ON victims((device_fingerprint->>'fingerprint_id'));
CREATE INDEX idx_victims_verification_status ON victims((identity_verification->>'verification_status'));

-- Composite index for common query patterns
CREATE INDEX idx_victims_market_value_status ON victims((validation->>'market_value'), (validation->>'status'));
```

### 2. OAuth Tokens Table
**Purpose**: Secure storage of captured OAuth tokens và related metadata
**Security**: AES-256-GCM encryption for all token data (encrypted at application level before storage)
**TTL**: Automatic expiration using PostgreSQL scheduled jobs (pg_cron extension)

```sql
-- Table: oauth_tokens
CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    victim_id UUID NOT NULL REFERENCES victims(id) ON DELETE CASCADE,
    
    -- OAuth provider information
    provider VARCHAR(50) NOT NULL, -- google, apple, facebook, microsoft
    provider_metadata JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "authorization_server": "https://accounts.google.com",
    --   "client_id": "captured_from_request",
    --   "scopes_granted": [
    --     "openid",
    --     "email",
    --     "profile",
    --     "https://www.googleapis.com/auth/gmail.readonly",
    --     "https://www.googleapis.com/auth/contacts.readonly",
    --     "https://www.googleapis.com/auth/calendar.readonly"
    --   ]
    -- }
    
    -- Encrypted token data (encrypted at application level before storage)
    token_data JSONB NOT NULL DEFAULT '{}',
    -- Example structure (encrypted values):
    -- {
    --   "access_token": {
    --     "encrypted_value": "AES256_ENCRYPTED_ACCESS_TOKEN_DATA",
    --     "encryption_key_id": "key_abc123def456",
    --     "nonce": "random_nonce_data",
    --     "tag": "authentication_tag"
    --   },
    --   "refresh_token": {
    --     "encrypted_value": "AES256_ENCRYPTED_REFRESH_TOKEN_DATA",
    --     "encryption_key_id": "key_abc123def456",
    --     "nonce": "random_nonce_data",
    --     "tag": "authentication_tag"
    --   },
    --   "id_token": {
    --     "encrypted_value": "AES256_ENCRYPTED_ID_TOKEN_DATA",
    --     "encryption_key_id": "key_abc123def456",
    --     "nonce": "random_nonce_data",
    --     "tag": "authentication_tag"
    --   }
    -- }
    
    -- Token metadata
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_refreshed TIMESTAMPTZ,
    refresh_count INTEGER NOT NULL DEFAULT 0,
    token_status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expired, revoked, invalid
    last_validation TIMESTAMPTZ,
    validation_success BOOLEAN,
    
    -- Token usage tracking (JSONB array)
    usage_history JSONB NOT NULL DEFAULT '[]',
    -- Example structure:
    -- [
    --   {
    --     "usage_timestamp": "2025-10-04T15:35:10.000Z",
    --     "usage_type": "validation", -- validation, gmail_access, contact_extraction
    --     "admin_id": "uuid-here",
    --     "ip_address": "10.0.0.100",
    --     "success": true,
    --     "api_calls": 3,
    --     "data_extracted": "profile_information"
    --   }
    -- ]
    
    -- Captured user profile (JSONB)
    user_profile JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "google_id": "1234567890123456789",
    --   "email": "ceo@techcorp.vn",
    --   "verified_email": true,
    --   "name": "Nguyễn Văn Nam",
    --   "given_name": "Nam",
    --   "family_name": "Nguyễn Văn",
    --   "picture": "https://lh3.googleusercontent.com/a/profile_picture_url",
    --   "locale": "vi",
    --   "hd": "techcorp.vn" -- Hosted domain for G Suite accounts
    -- }
    
    -- Security monitoring (JSONB array)
    security_events JSONB NOT NULL DEFAULT '[]',
    -- Example structure:
    -- [
    --   {
    --     "event_type": "token_created",
    --     "timestamp": "2025-10-04T15:30:25.000Z",
    --     "details": "OAuth token successfully captured"
    --   },
    --   {
    --     "event_type": "token_validated",
    --     "timestamp": "2025-10-04T15:35:10.000Z",
    --     "details": "Token validation successful"
    --   }
    -- ]
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for oauth_tokens table
CREATE INDEX idx_oauth_tokens_victim_id ON oauth_tokens(victim_id);
CREATE INDEX idx_oauth_tokens_provider_status ON oauth_tokens(provider, token_status);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_tokens_issued_at ON oauth_tokens(issued_at DESC);
CREATE INDEX idx_oauth_tokens_status ON oauth_tokens(token_status) WHERE token_status = 'active';

-- GIN indexes for JSONB columns
CREATE INDEX idx_oauth_tokens_provider_metadata ON oauth_tokens USING GIN(provider_metadata);
CREATE INDEX idx_oauth_tokens_token_data ON oauth_tokens USING GIN(token_data);
CREATE INDEX idx_oauth_tokens_user_profile ON oauth_tokens USING GIN(user_profile);

-- Function to automatically mark expired tokens
CREATE OR REPLACE FUNCTION mark_expired_oauth_tokens()
RETURNS void AS $$
BEGIN
    UPDATE oauth_tokens
    SET token_status = 'expired', updated_at = NOW()
    WHERE expires_at < NOW() AND token_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-tokens', '0 * * * *', 'SELECT mark_expired_oauth_tokens();');
```

### 3. Admin Users Table
**Purpose**: Administrative user management với role-based permissions
**Security**: Bcrypt password hashing, MFA support, session tracking

```sql
-- Table: admin_users
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic admin information
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Role và permissions
    role VARCHAR(50) NOT NULL, -- viewer, operator, senior_operator, admin, super_admin
    permissions TEXT[] NOT NULL DEFAULT '{}',
    -- Example: ARRAY['dashboard_view', 'victim_management', 'gmail_exploitation', 'campaign_management', 'data_export', 'system_monitoring']
    
    -- Access restrictions (JSONB)
    access_restrictions JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "ip_whitelist": ["10.0.0.0/24", "192.168.1.0/24"],
    --   "time_restrictions": {
    --     "allowed_hours": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18], -- 8 AM - 6 PM
    --     "timezone": "Asia/Ho_Chi_Minh"
    --   },
    --   "data_access_level": "high_value_targets" -- all, high_value_targets, assigned_campaigns
    -- }
    
    -- Multi-factor authentication (JSONB, encrypted at application level)
    mfa_config JSONB NOT NULL DEFAULT '{}',
    -- Example structure (encrypted values):
    -- {
    --   "mfa_enabled": true,
    --   "mfa_method": "totp", -- totp, sms, email
    --   "totp_secret": "ENCRYPTED_TOTP_SECRET_KEY",
    --   "backup_codes": ["ENCRYPTED_BACKUP_CODE_1", "ENCRYPTED_BACKUP_CODE_2"],
    --   "last_mfa_reset": "2025-09-15T10:00:00.000Z"
    -- }
    
    -- Session management (JSONB)
    session_config JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "max_concurrent_sessions": 3,
    --   "session_timeout_minutes": 120,
    --   "idle_timeout_minutes": 30,
    --   "require_fresh_auth_for_sensitive": true
    -- }
    
    -- Activity tracking (JSONB)
    activity_summary JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "last_login": "2025-10-04T14:30:00.000Z",
    --   "last_activity": "2025-10-04T16:25:00.000Z",
    --   "login_count_30d": 28,
    --   "failed_login_attempts_24h": 0,
    --   "victims_accessed_30d": 45,
    --   "gmail_exploitations_30d": 23,
    --   "data_exports_30d": 8
    -- }
    
    -- Security monitoring (JSONB)
    security_flags JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "account_locked": false,
    --   "password_expired": false,
    --   "suspicious_activity": false,
    --   "last_password_change": "2025-09-01T00:00:00.000Z",
    --   "password_change_required": false
    -- }
    
    -- Admin metadata (JSONB)
    admin_metadata JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "created_by": "uuid-here",
    --   "department": "Security Operations",
    --   "clearance_level": "high",
    --   "training_completed": ["opsec_fundamentals", "gmail_exploitation", "legal_compliance"]
    -- }
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes for admin_users table
CREATE UNIQUE INDEX idx_admin_users_username ON admin_users(username) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_admin_users_email ON admin_users(email) WHERE is_active = TRUE;
CREATE INDEX idx_admin_users_role_active ON admin_users(role, is_active);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = TRUE;

-- GIN indexes for JSONB columns
CREATE INDEX idx_admin_users_access_restrictions ON admin_users USING GIN(access_restrictions);
CREATE INDEX idx_admin_users_mfa_config ON admin_users USING GIN(mfa_config);
CREATE INDEX idx_admin_users_activity_summary ON admin_users USING GIN(activity_summary);
CREATE INDEX idx_admin_users_security_flags ON admin_users USING GIN(security_flags);

-- Index on last_login for activity queries
CREATE INDEX idx_admin_users_last_login ON admin_users((activity_summary->>'last_login') DESC NULLS LAST);
```

### 4. Campaigns Table
**Purpose**: Phishing campaign management và performance tracking
**Analytics**: Real-time campaign metrics và success rate tracking

```sql
-- Table: campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign identification
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Campaign configuration (JSONB)
    config JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "target_domains": ["zalopay-merchant.com", "zalopay-business.net", "merchant.zalopay.vn"],
    --   "landing_template": "zalopay_merchant_v2_vietnamese",
    --   "authentication_methods": ["google_oauth", "apple_oauth", "manual_form"],
    --   "geographic_targeting": {
    --     "primary_countries": ["VN"],
    --     "secondary_countries": ["TH", "MY", "SG"],
    --     "exclude_countries": ["US", "EU", "AU"]
    --   },
    --   "demographic_targeting": {
    --     "target_languages": ["vi", "vi-VN"],
    --     "business_focus": true,
    --     "executive_targeting": true,
    --     "tech_savvy_level": "medium"
    --   }
    -- }
    
    -- Infrastructure configuration (JSONB)
    infrastructure JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "proxy_pool": "vietnam_residential_premium",
    --   "anti_detection_level": "high",
    --   "load_balancing": "round_robin",
    --   "backup_domains": ["zalopay-registration.com", "merchant-zalopay.net"]
    -- }
    
    -- Campaign timeline (JSONB)
    timeline JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "planned_start": "2025-10-01T00:00:00.000Z",
    --   "actual_start": "2025-10-01T08:30:00.000Z",
    --   "planned_end": "2025-12-31T23:59:59.000Z",
    --   "current_phase": "active_exploitation", -- planning, launch, active_exploitation, data_mining, cleanup
    --   "milestones": [...]
    -- }
    
    -- Real-time statistics (JSONB, updated via triggers or application logic)
    statistics JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "total_visits": 3247,
    --   "unique_visitors": 2891,
    --   "credential_captures": 847,
    --   "successful_validations": 612,
    --   "high_value_targets": 89,
    --   "business_accounts": 234,
    --   "conversion_rates": {...},
    --   "performance_metrics": {...},
    --   "geographic_distribution": {...},
    --   "hourly_performance": {...}
    -- }
    
    -- Success criteria (JSONB)
    success_criteria JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "target_captures": 1000,
    --   "target_validations": 700,
    --   "target_high_value": 100,
    --   "min_success_rate": 0.20,
    --   "max_detection_incidents": 5
    -- }
    
    -- Risk management (JSONB)
    risk_assessment JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "current_risk_level": "medium", -- low, medium, high, critical
    --   "detection_incidents": 2,
    --   "law_enforcement_interest": "none", -- none, monitoring, investigating, active
    --   "technical_countermeasures": 1,
    --   "mitigation_actions": ["domain_rotation_implemented", "proxy_pool_expanded", "content_variation_increased"]
    -- }
    
    -- Team assignment (JSONB)
    team JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "campaign_manager": "uuid-here",
    --   "technical_lead": "uuid-here",
    --   "analysts": ["uuid-here", "uuid-here"],
    --   "operators": ["uuid-here", "uuid-here"]
    -- }
    
    -- Campaign status
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, paused, suspended, completed, archived
    
    -- Status history (JSONB array)
    status_history JSONB NOT NULL DEFAULT '[]',
    -- Example structure:
    -- [
    --   {
    --     "status": "draft",
    --     "timestamp": "2025-09-15T10:00:00.000Z",
    --     "changed_by": "uuid-here",
    --     "reason": "Campaign created"
    --   },
    --   {
    --     "status": "active",
    --     "timestamp": "2025-10-01T08:30:00.000Z",
    --     "changed_by": "uuid-here",
    --     "reason": "Campaign launched"
    --   }
    -- ]
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id)
);

-- Indexes for campaigns table
CREATE UNIQUE INDEX idx_campaigns_code ON campaigns(code);
CREATE INDEX idx_campaigns_status ON campaigns(status, (timeline->>'actual_start') DESC NULLS LAST);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_is_active ON campaigns(status) WHERE status IN ('active', 'paused');

-- GIN indexes for JSONB columns
CREATE INDEX idx_campaigns_config ON campaigns USING GIN(config);
CREATE INDEX idx_campaigns_infrastructure ON campaigns USING GIN(infrastructure);
CREATE INDEX idx_campaigns_timeline ON campaigns USING GIN(timeline);
CREATE INDEX idx_campaigns_statistics ON campaigns USING GIN(statistics);
CREATE INDEX idx_campaigns_risk_assessment ON campaigns USING GIN(risk_assessment);
CREATE INDEX idx_campaigns_team ON campaigns USING GIN(team);

-- Indexes on specific JSONB paths
CREATE INDEX idx_campaigns_primary_countries ON campaigns USING GIN((config->'geographic_targeting'->'primary_countries'));
```

### 5. Activity Logs Table
**Purpose**: Comprehensive audit trail cho all administrative actions
**Retention**: 2-year retention với automated archival using PostgreSQL scheduled jobs
**Compliance**: SOC2 và legal compliance requirements

```sql
-- Table: activity_logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action identification
    log_id VARCHAR(100) UNIQUE NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- Structured action classification
    action_category VARCHAR(50) NOT NULL, -- authentication, data_access, system_admin, campaign_mgmt
    severity_level VARCHAR(20) NOT NULL, -- low, medium, high, critical
    
    -- Actor information (JSONB)
    actor JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "admin_id": "uuid-here",
    --   "username": "admin_operator_01",
    --   "role": "senior_operator",
    --   "session_id": "admin_session_20251004_143000_xyz789"
    -- }
    
    -- Target information (JSONB)
    target JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "resource_type": "victim_gmail_account",
    --   "resource_id": "uuid-here",
    --   "resource_identifier": "ceo@techcorp.vn",
    --   "additional_context": {
    --     "market_value": "high",
    --     "account_type": "business",
    --     "exploitation_method": "oauth_tokens"
    --   }
    -- }
    
    -- Action details (JSONB)
    action_details JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "operation": "gmail_access_initiate",
    --   "parameters": {...},
    --   "execution_time_seconds": 0.045,
    --   "success": true,
    --   "result_summary": {...}
    -- }
    
    -- Technical context (JSONB)
    technical_context JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "ip_address": "10.0.0.100",
    --   "user_agent": "Mozilla/5.0...",
    --   "proxy_used": "socks5://admin-proxy-singapore-01.secure.com:1080",
    --   "vpn_endpoint": "singapore_secure_01",
    --   "request_id": "req_20251004_162530_def456",
    --   "api_version": "v2.1"
    -- }
    
    -- Geographic context (JSONB)
    geographic_context JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "admin_location": {
    --     "country": "SG",
    --     "city": "Singapore",
    --     "timezone": "Asia/Singapore",
    --     "coordinates": [1.3521, 103.8198]
    --   },
    --   "target_location": {
    --     "country": "VN",
    --     "city": "Ho Chi Minh City",
    --     "timezone": "Asia/Ho_Chi_Minh"
    --   }
    -- }
    
    -- Security monitoring (JSONB)
    security_flags JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "suspicious_activity": false,
    --   "unusual_timing": false,
    --   "abnormal_access_pattern": false,
    --   "elevated_privilege_use": true,
    --   "cross_border_access": true
    -- }
    
    -- Compliance tracking (JSONB)
    compliance JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "requires_approval": false,
    --   "approved_by": null,
    --   "legal_basis": "authorized_security_testing",
    --   "data_classification": "highly_sensitive",
    --   "retention_period_days": 730,
    --   "export_restricted": true
    -- }
    
    -- Related activities (UUID array)
    related_logs UUID[] DEFAULT '{}',
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Archival information
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    archive_date TIMESTAMPTZ,
    retention_expires TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 years')
);

-- Indexes for activity_logs table
CREATE INDEX idx_activity_logs_admin_id ON activity_logs((actor->>'admin_id'), timestamp DESC);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type, timestamp DESC);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_retention_expires ON activity_logs(retention_expires);
CREATE INDEX idx_activity_logs_category_severity ON activity_logs(action_category, severity_level, timestamp DESC);
CREATE INDEX idx_activity_logs_archived ON activity_logs(archived) WHERE archived = FALSE;

-- GIN indexes for JSONB columns
CREATE INDEX idx_activity_logs_actor ON activity_logs USING GIN(actor);
CREATE INDEX idx_activity_logs_target ON activity_logs USING GIN(target);
CREATE INDEX idx_activity_logs_action_details ON activity_logs USING GIN(action_details);
CREATE INDEX idx_activity_logs_technical_context ON activity_logs USING GIN(technical_context);

-- Indexes on specific JSONB paths
CREATE INDEX idx_activity_logs_resource_type_id ON activity_logs((target->>'resource_type'), (target->>'resource_id'));

-- Function to automatically archive old logs
CREATE OR REPLACE FUNCTION archive_old_activity_logs()
RETURNS void AS $$
BEGIN
    UPDATE activity_logs
    SET archived = TRUE, archive_date = NOW()
    WHERE retention_expires < NOW() AND archived = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic archival (requires pg_cron extension)
-- SELECT cron.schedule('archive-activity-logs', '0 2 * * *', 'SELECT archive_old_activity_logs();');
```

### 6. Gmail Access Logs Table
**Purpose**: Detailed logging of Gmail exploitation activities
**Analysis**: Intelligence gathering effectiveness tracking

```sql
-- Table: gmail_access_logs
CREATE TABLE gmail_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Access session identification
    session_id VARCHAR(100) UNIQUE NOT NULL,
    parent_activity_log UUID REFERENCES activity_logs(id),
    
    -- Participants
    admin_id UUID NOT NULL REFERENCES admin_users(id),
    victim_id UUID NOT NULL REFERENCES victims(id) ON DELETE CASCADE,
    
    -- Access methodology
    access_method VARCHAR(50) NOT NULL, -- oauth_tokens, session_cookies, credential_replay
    
    -- Authentication details (JSONB)
    authentication_details JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "oauth_provider": "google",
    --   "token_freshness": "current", -- current, refreshed, expired
    --   "scope_coverage": [
    --     "https://www.googleapis.com/auth/gmail.readonly",
    --     "https://www.googleapis.com/auth/contacts.readonly"
    --   ],
    --   "api_calls_made": 47,
    --   "rate_limit_encountered": false
    -- }
    
    -- Session timeline (JSONB)
    session_timeline JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "initiation": "2025-10-04T16:25:30.000Z",
    --   "authentication_complete": "2025-10-04T16:25:35.000Z",
    --   "data_extraction_start": "2025-10-04T16:25:40.000Z",
    --   "data_extraction_complete": "2025-10-04T16:42:15.000Z",
    --   "session_cleanup": "2025-10-04T16:42:30.000Z",
    --   "total_duration_seconds": 1020
    -- }
    
    -- Extracted intelligence (JSONB)
    extraction_results JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "emails": {
    --     "total_accessible": 15420,
    --     "filtered_for_intelligence": 2847,
    --     "extracted_count": 456,
    --     "high_value_count": 89,
    --     "categories": {...}
    --   },
    --   "contacts": {...},
    --   "attachments": {...},
    --   "calendar_data": {...}
    -- }
    
    -- Intelligence analysis (JSONB)
    intelligence_analysis JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "overall_intelligence_value": 0.87,
    --   "business_intelligence_score": 0.92,
    --   "security_intelligence_score": 0.73,
    --   "personal_intelligence_score": 0.65,
    --   "key_findings": [...],
    --   "exploitation_opportunities": [...],
    --   "risk_indicators": [...]
    -- }
    
    -- Operational security (JSONB)
    operational_security JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "proxy_configuration": {...},
    --   "fingerprinting": {...},
    --   "trace_cleanup": {...}
    -- }
    
    -- Export tracking (JSONB array)
    data_exports JSONB NOT NULL DEFAULT '[]',
    -- Example structure:
    -- [
    --   {
    --     "export_id": "export_20251004_164230_jkl012",
    --     "export_type": "high_value_emails",
    --     "format": "json",
    --     "record_count": 89,
    --     "file_size_bytes": 2456789,
    --     "export_location": "/secure/exports/emails_ceo_techcorp_20251004.json.encrypted",
    --     "exported_at": "2025-10-04T16:42:30.000Z"
    --   }
    -- ]
    
    -- Performance metrics (JSONB)
    performance_metrics JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "api_calls_per_minute": 2.8,
    --   "data_transfer_rate_mbps": 1.2,
    --   "error_rate": 0.02,
    --   "retry_count": 3,
    --   "timeout_count": 0
    -- }
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress' -- in_progress, completed, failed, aborted
);

-- Indexes for gmail_access_logs table
CREATE INDEX idx_gmail_access_logs_admin_id ON gmail_access_logs(admin_id, created_at DESC);
CREATE INDEX idx_gmail_access_logs_victim_id ON gmail_access_logs(victim_id, created_at DESC);
CREATE INDEX idx_gmail_access_logs_status ON gmail_access_logs(status, created_at DESC);
CREATE INDEX idx_gmail_access_logs_parent_activity ON gmail_access_logs(parent_activity_log);

-- GIN indexes for JSONB columns
CREATE INDEX idx_gmail_access_logs_authentication_details ON gmail_access_logs USING GIN(authentication_details);
CREATE INDEX idx_gmail_access_logs_session_timeline ON gmail_access_logs USING GIN(session_timeline);
CREATE INDEX idx_gmail_access_logs_extraction_results ON gmail_access_logs USING GIN(extraction_results);
CREATE INDEX idx_gmail_access_logs_intelligence_analysis ON gmail_access_logs USING GIN(intelligence_analysis);
CREATE INDEX idx_gmail_access_logs_operational_security ON gmail_access_logs USING GIN(operational_security);

-- Indexes on specific JSONB paths
CREATE INDEX idx_gmail_access_logs_intelligence_value ON gmail_access_logs((intelligence_analysis->>'overall_intelligence_value') DESC NULLS LAST);
CREATE INDEX idx_gmail_access_logs_initiation ON gmail_access_logs((session_timeline->>'initiation') DESC NULLS LAST);
```

### 7. Devices Table
**Purpose**: Storage for connected devices managed via DogeRat API
**Security**: Device metadata storage, connection tracking
**TTL**: Automatic cleanup of offline devices after configurable period

```sql
-- Table: devices
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Device identification
    device_id VARCHAR(255) UNIQUE NOT NULL, -- Socket ID or unique device identifier
    platform VARCHAR(50) NOT NULL, -- android, ios
    platform_version VARCHAR(100), -- Android version or iOS version
    
    -- Device information
    model VARCHAR(255),
    version VARCHAR(100), -- OS version
    ip_address VARCHAR(50),
    
    -- Connection information
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'offline', -- online, offline
    
    -- Device metadata (JSONB)
    metadata JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "socket_id": "socket_abc123",
    --   "user_agent": "Mozilla/5.0...",
    --   "screen_resolution": "1920x1080",
    --   "battery_level": 85,
    --   "network_type": "wifi",
    --   "sim_card_info": {
    --     "provider": "Viettel",
    --     "phone_number": "+84901234567"
    --   }
    -- }
    
    -- Connection history (JSONB array)
    connection_history JSONB NOT NULL DEFAULT '[]',
    -- Example structure:
    -- [
    --   {
    --     "connected_at": "2025-01-15T10:30:00.000Z",
    --     "disconnected_at": "2025-01-15T12:45:00.000Z",
    --     "duration_seconds": 8100,
    --     "ip_address": "192.168.1.100"
    --   }
    -- ]
    
    -- Activity summary (JSONB)
    activity_summary JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "total_actions": 45,
    --   "last_action": "2025-01-15T14:30:00.000Z",
    --   "actions_count_24h": 12,
    --   "data_collected": {
    --     "contacts": 1247,
    --     "sms": 89,
    --     "calls": 234,
    --     "gallery": 567,
    --     "screenshots": 23
    --   }
    -- }
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for devices table
CREATE UNIQUE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_platform ON devices(platform, status);
CREATE INDEX idx_devices_status ON devices(status, last_seen DESC);
CREATE INDEX idx_devices_connected_at ON devices(connected_at DESC);
CREATE INDEX idx_devices_last_seen ON devices(last_seen DESC);

-- GIN indexes for JSONB columns
CREATE INDEX idx_devices_metadata ON devices USING GIN(metadata);
CREATE INDEX idx_devices_connection_history ON devices USING GIN(connection_history);
CREATE INDEX idx_devices_activity_summary ON devices USING GIN(activity_summary);

-- Indexes on specific JSONB paths
CREATE INDEX idx_devices_socket_id ON devices((metadata->>'socket_id'));
CREATE INDEX idx_devices_online_status ON devices(status) WHERE status = 'online';
```

### 8. Device Data Table
**Purpose**: Storage for data collected from devices via DogeRat API
**Security**: Device data storage, type-based organization
**TTL**: Automatic cleanup of old data after configurable retention period

```sql
-- Table: device_data
CREATE TABLE device_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Data type identification
    data_type VARCHAR(100) NOT NULL, -- contacts, sms, calls, gallery, camera, screenshots, keylogger, clipboard, location, apps, files, microphone, audio
    
    -- Data content (JSONB)
    data JSONB NOT NULL DEFAULT '{}',
    -- Example structure varies by data_type:
    -- For contacts:
    -- {
    --   "contacts": [
    --     {
    --       "name": "Nguyễn Văn A",
    --       "phone": "+84901234567",
    --       "email": "nguyenvana@example.com"
    --     }
    --   ]
    -- }
    -- For SMS:
    -- {
    --   "messages": [
    --     {
    --       "from": "+84901234567",
    --       "to": "+84987654321",
    --       "body": "Message content",
    --       "timestamp": "2025-01-15T10:30:00.000Z"
    --     }
    --   ]
    -- }
    
    -- Metadata (JSONB)
    metadata JSONB NOT NULL DEFAULT '{}',
    -- Example structure:
    -- {
    --   "count": 1247,
    --   "last_updated": "2025-01-15T14:30:00.000Z",
    --   "source": "dogerat_api",
    --   "action_id": "action_abc123"
    -- }
    
    -- Capture timestamp
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for device_data table
CREATE INDEX idx_device_data_device_id ON device_data(device_id, captured_at DESC);
CREATE INDEX idx_device_data_type ON device_data(data_type, captured_at DESC);
CREATE INDEX idx_device_data_captured_at ON device_data(captured_at DESC);
CREATE INDEX idx_device_data_device_type ON device_data(device_id, data_type, captured_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX idx_device_data_data ON device_data USING GIN(data);
CREATE INDEX idx_device_data_metadata ON device_data USING GIN(metadata);

-- Composite index for common query patterns
CREATE INDEX idx_device_data_device_type_time ON device_data(device_id, data_type, captured_at DESC);
```

## Advanced Database Features

### 1. Data Encryption Strategy
**Application-Level Encryption**: All sensitive data is encrypted at the application level before storage in PostgreSQL.

```sql
-- Encryption is handled at application level using Node.js crypto module
-- Sensitive fields that require encryption:
-- - victims.password_hash (bcrypt hashing)
-- - oauth_tokens.token_data (AES-256-GCM encryption)
-- - admin_users.password_hash (bcrypt hashing)
-- - admin_users.mfa_config.totp_secret (AES-256-GCM encryption)

-- PostgreSQL pgcrypto extension can be used for database-level encryption if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Example: Encrypt sensitive data at application level before INSERT
-- TypeScript/Node.js code handles encryption, PostgreSQL stores encrypted values
```

**Key Management**:
- Master encryption keys stored in environment variables (Replit Secrets)
- Field-level encryption keys rotated quarterly
- Keys never stored in database, only in secure environment configuration

### 2. Table Partitioning Strategy
**PostgreSQL Partitioning** for large tables (alternative to MongoDB sharding):

```sql
-- Partition activity_logs by timestamp for better performance
CREATE TABLE activity_logs (
    -- ... column definitions ...
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE activity_logs_2025_10 PARTITION OF activity_logs
    FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

CREATE TABLE activity_logs_2025_11 PARTITION OF activity_logs
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Auto-create partitions using pg_partman extension (if available)
-- Or use application-level logic to create partitions monthly

-- Partition gmail_access_logs by created_at
CREATE TABLE gmail_access_logs (
    -- ... column definitions ...
) PARTITION BY RANGE (created_at);

-- Partition strategy rationale:
-- - activity_logs: Time-based partitioning for efficient archival and querying
-- - gmail_access_logs: Time-based partitioning for performance optimization
-- - victims: No partitioning needed (manageable size with proper indexing)
-- - oauth_tokens: No partitioning needed (TTL-based cleanup sufficient)
```

### 3. Performance Optimization
**PostgreSQL Optimization Strategies**:

```sql
-- Connection Pooling (using Prisma in Express.js)
-- Configured in Prisma schema and application code:
-- Prisma automatically manages connection pooling
-- Configuration in schema.prisma:
-- datasource db {
--   provider = "postgresql"
--   url      = env("DATABASE_URL")
--   connection_limit = 20
-- }

-- Materialized Views for Analytics (pre-computed aggregations)
CREATE MATERIALIZED VIEW campaign_analytics AS
SELECT 
    c.id as campaign_id,
    c.code,
    COUNT(v.id) as total_victims,
    COUNT(CASE WHEN v.validation->>'status' = 'validated' THEN 1 END) as validated_count,
    COUNT(CASE WHEN v.validation->>'market_value' = 'high' THEN 1 END) as high_value_count
FROM campaigns c
LEFT JOIN victims v ON v.campaign_id = c.id
WHERE v.deleted_at IS NULL
GROUP BY c.id, c.code;

-- Refresh materialized view periodically (via application scheduler)
-- REFRESH MATERIALIZED VIEW campaign_analytics;

-- Partial Indexes for common query patterns
CREATE INDEX idx_victims_active_validated ON victims(campaign_id, capture_timestamp DESC)
WHERE is_active = TRUE AND validation->>'status' = 'validated';

CREATE INDEX idx_gmail_access_logs_completed ON gmail_access_logs(admin_id, created_at DESC)
WHERE status = 'completed';

-- JSONB Query Optimization
-- Use GIN indexes (already created) for fast JSONB queries
-- Use jsonb_path_ops for specific query patterns if needed
CREATE INDEX idx_victims_validation_gin_path ON victims USING GIN(validation jsonb_path_ops);
```

### 4. Data Retention & Archival
**PostgreSQL-Based Data Lifecycle Management**:

```sql
-- Data retention policies implemented via scheduled jobs (pg_cron or application-level)

-- Retention configuration (stored in application config):
-- {
--   "victims": {
--     "active_period": "2_years",
--     "archive_period": "5_years",
--     "deletion_after": "7_years"
--   },
--   "oauth_tokens": {
--     "active_period": "token_expiry + 90_days",
--     "archive_period": "1_year",
--     "deletion_after": "1_year"
--   },
--   "activity_logs": {
--     "active_period": "2_years",
--     "archive_period": "5_years",
--     "deletion_after": "7_years"
--   },
--   "gmail_access_logs": {
--     "active_period": "1_year",
--     "archive_period": "2_years",
--     "deletion_after": "3_years"
--   }
-- }

-- Archival function (runs via pg_cron or FastAPI BackgroundTasks)
CREATE OR REPLACE FUNCTION archive_old_data()
RETURNS void AS $$
BEGIN
    -- Archive old activity logs
    UPDATE activity_logs
    SET archived = TRUE, archive_date = NOW()
    WHERE retention_expires < NOW() AND archived = FALSE;
    
    -- Archive old gmail access logs
    UPDATE gmail_access_logs
    SET status = 'archived'
    WHERE created_at < NOW() - INTERVAL '1 year' AND status = 'completed';
    
    -- Mark expired OAuth tokens
    UPDATE oauth_tokens
    SET token_status = 'expired'
    WHERE expires_at < NOW() AND token_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron (if available) or FastAPI BackgroundTasks
-- SELECT cron.schedule('archive-old-data', '0 2 * * *', 'SELECT archive_old_data();');
```

## Database Monitoring & Maintenance

### Performance Monitoring
**PostgreSQL Performance Monitoring**:

```sql
-- Enable PostgreSQL statistics collection
-- Configured in postgresql.conf:
-- shared_preload_libraries = 'pg_stat_statements'
-- track_activity_query_size = 2048
-- pg_stat_statements.track = all

-- Query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- Queries taking more than 1 second
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Table size monitoring
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage monitoring
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;  -- Unused indexes

-- Connection monitoring
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = current_database();
```

**Application-Level Monitoring** (Express.js):
- Query execution time tracking via middleware
- Database connection pool monitoring (Prisma)
- Slow query alerts via logging
- Real-time metrics via Socket.io updates to admin dashboard

### Backup Strategy
**PostgreSQL Backup Configuration for Replit**:

```sql
-- PostgreSQL backup strategy for Replit environment
-- Note: Replit provides automatic backups, but additional backups recommended

-- Manual backup commands (run via application or cron):
-- pg_dump -Fc -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d).dump

-- Backup configuration (application-level):
-- {
--   "backup_frequency": {
--     "incremental": "hourly",  // Via application scheduler (node-cron)
--     "full": "daily"           // Via application scheduler (node-cron)
--   },
--   "storage_locations": {
--     "primary": "Replit file system (encrypted)",
--     "secondary": "External cloud storage (encrypted)"
--   },
--   "encryption": {
--     "algorithm": "AES-256-GCM",
--     "key_management": "Environment variables (Replit Secrets)",
--     "key_rotation": "monthly"
--   },
--   "retention": {
--     "daily_backups": 7,
--     "weekly_backups": 4,
--     "monthly_backups": 12
--   }
-- }

-- Automated backup function (TypeScript/Express.js)
-- Implemented in application code using Prisma and pg_dump subprocess
-- Scheduled via node-cron or Bull queue
```

**Replit-Specific Considerations**:
- Use Replit's built-in database backup features
- Store backup encryption keys in Replit Secrets
- Implement application-level backup scheduling
- Monitor disk usage to stay within Replit limits

## Environment Setup & Configuration

### Required Environment Variables

**Database Connection** (Replit PostgreSQL):
```bash
# .env file or Replit Secrets
DB_HOST=your-replit-db-host.replit.dev
DB_PORT=5432
DB_NAME=zalopay_merchant
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_SSL_MODE=require

# Connection Pool Settings
DB_POOL_MIN_SIZE=5
DB_POOL_MAX_SIZE=20
DB_POOL_TIMEOUT=60
```

**Encryption Keys** (Replit Secrets - NEVER commit to git):
```bash
# Master encryption key for sensitive data (32 bytes for AES-256)
CARD_ENCRYPTION_KEY=your-32-byte-encryption-key-here

# Key rotation (optional)
CARD_ENCRYPTION_KEY_ID=key_v1
```

**File Storage Configuration**:
```bash
# File storage base path
STORAGE_BASE_PATH=/secure/storage

# Identity verification files
STORAGE_IDENTITY_PATH=/secure/storage/identity
STORAGE_CARD_IMAGES_PATH=/secure/storage/identity/card_images
STORAGE_TRANSACTION_HISTORY_PATH=/secure/storage/identity/transaction_history

# Document storage
STORAGE_DOCUMENTS_PATH=/secure/storage/documents
STORAGE_BUSINESS_LICENSES_PATH=/secure/storage/documents/business_licenses
STORAGE_REPRESENTATIVE_IDS_PATH=/secure/storage/documents/representative_ids
STORAGE_BUSINESS_LOCATION_PHOTOS_PATH=/secure/storage/documents/business_location_photos

# Max file sizes (in bytes)
MAX_FILE_SIZE=16777216  # 16MB
MAX_CARD_IMAGE_SIZE=16777216
MAX_TRANSACTION_HISTORY_SIZE=16777216
```

**Application Configuration**:
```bash
# Application settings
APP_ENV=production
APP_SECRET_KEY=your-secret-key-for-sessions
SESSION_TIMEOUT_MINUTES=120

# OAuth Configuration
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_APPLE_CLIENT_ID=your-apple-client-id
OAUTH_APPLE_CLIENT_SECRET=your-apple-client-secret
```

### Connection String Format

**For Prisma (Express.js)**:
```typescript
// Connection string format in .env file
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

// Prisma schema configuration (schema.prisma)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 20
}

// Or using individual parameters in Prisma Client initialization
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});
```

## Migration Scripts

### Initial Schema Creation

**File: `migrations/001_initial_schema.sql`**

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create all tables (use CREATE TABLE statements from sections above)
-- Victims table
CREATE TABLE victims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    password_hash VARCHAR(255),
    capture_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    campaign_id UUID REFERENCES campaigns(id),
    capture_method VARCHAR(50) NOT NULL,
    capture_source VARCHAR(255),
    session_data JSONB NOT NULL DEFAULT '{}',
    device_fingerprint JSONB NOT NULL DEFAULT '{}',
    validation JSONB NOT NULL DEFAULT '{}',
    exploitation_history JSONB NOT NULL DEFAULT '{}',
    risk_assessment JSONB NOT NULL DEFAULT '{}',
    card_information JSONB NOT NULL DEFAULT '{}',
    identity_verification JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- OAuth tokens table
CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    victim_id UUID NOT NULL REFERENCES victims(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_metadata JSONB NOT NULL DEFAULT '{}',
    token_data JSONB NOT NULL DEFAULT '{}',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_refreshed TIMESTAMPTZ,
    refresh_count INTEGER NOT NULL DEFAULT 0,
    token_status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_validation TIMESTAMPTZ,
    validation_success BOOLEAN,
    usage_history JSONB NOT NULL DEFAULT '[]',
    user_profile JSONB NOT NULL DEFAULT '{}',
    security_events JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    access_restrictions JSONB NOT NULL DEFAULT '{}',
    mfa_config JSONB NOT NULL DEFAULT '{}',
    session_config JSONB NOT NULL DEFAULT '{}',
    activity_summary JSONB NOT NULL DEFAULT '{}',
    security_flags JSONB NOT NULL DEFAULT '{}',
    admin_metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}',
    infrastructure JSONB NOT NULL DEFAULT '{}',
    timeline JSONB NOT NULL DEFAULT '{}',
    statistics JSONB NOT NULL DEFAULT '{}',
    success_criteria JSONB NOT NULL DEFAULT '{}',
    risk_assessment JSONB NOT NULL DEFAULT '{}',
    team JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    status_history JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id)
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_id VARCHAR(100) UNIQUE NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_category VARCHAR(50) NOT NULL,
    severity_level VARCHAR(20) NOT NULL,
    actor JSONB NOT NULL DEFAULT '{}',
    target JSONB NOT NULL DEFAULT '{}',
    action_details JSONB NOT NULL DEFAULT '{}',
    technical_context JSONB NOT NULL DEFAULT '{}',
    geographic_context JSONB NOT NULL DEFAULT '{}',
    security_flags JSONB NOT NULL DEFAULT '{}',
    compliance JSONB NOT NULL DEFAULT '{}',
    related_logs UUID[] DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    archive_date TIMESTAMPTZ,
    retention_expires TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 years')
);

-- Gmail access logs table
CREATE TABLE gmail_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    parent_activity_log UUID REFERENCES activity_logs(id),
    admin_id UUID NOT NULL REFERENCES admin_users(id),
    victim_id UUID NOT NULL REFERENCES victims(id) ON DELETE CASCADE,
    access_method VARCHAR(50) NOT NULL,
    authentication_details JSONB NOT NULL DEFAULT '{}',
    session_timeline JSONB NOT NULL DEFAULT '{}',
    extraction_results JSONB NOT NULL DEFAULT '{}',
    intelligence_analysis JSONB NOT NULL DEFAULT '{}',
    operational_security JSONB NOT NULL DEFAULT '{}',
    data_exports JSONB NOT NULL DEFAULT '[]',
    performance_metrics JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress'
);

-- Devices table (DogeRat API integration)
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    platform_version VARCHAR(100),
    model VARCHAR(255),
    version VARCHAR(100),
    ip_address VARCHAR(50),
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'offline',
    metadata JSONB NOT NULL DEFAULT '{}',
    connection_history JSONB NOT NULL DEFAULT '[]',
    activity_summary JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Device data table (DogeRat API integration)
CREATE TABLE device_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    data_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**File: `migrations/002_create_indexes.sql`**

```sql
-- Indexes for victims table
CREATE UNIQUE INDEX idx_victims_email ON victims(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_victims_capture_timestamp ON victims(capture_timestamp DESC);
CREATE INDEX idx_victims_campaign_id ON victims(campaign_id, capture_timestamp DESC);
CREATE INDEX idx_victims_is_active ON victims(is_active) WHERE is_active = TRUE;

-- GIN indexes for JSONB columns
CREATE INDEX idx_victims_session_data ON victims USING GIN(session_data);
CREATE INDEX idx_victims_device_fingerprint ON victims USING GIN(device_fingerprint);
CREATE INDEX idx_victims_validation ON victims USING GIN(validation);
CREATE INDEX idx_victims_risk_assessment ON victims USING GIN(risk_assessment);
CREATE INDEX idx_victims_card_information ON victims USING GIN(card_information);
CREATE INDEX idx_victims_identity_verification ON victims USING GIN(identity_verification);

-- Indexes on specific JSONB paths
CREATE INDEX idx_victims_validation_status ON victims((validation->>'status'));
CREATE INDEX idx_victims_validation_market_value ON victims((validation->>'market_value'));
CREATE INDEX idx_victims_validation_account_type ON victims((validation->>'account_type'));
CREATE INDEX idx_victims_session_ip ON victims((session_data->>'ip_address'));
CREATE INDEX idx_victims_fingerprint_id ON victims((device_fingerprint->>'fingerprint_id'));
CREATE INDEX idx_victims_verification_status ON victims((identity_verification->>'verification_status'));

-- Composite index for common query patterns
CREATE INDEX idx_victims_market_value_status ON victims((validation->>'market_value'), (validation->>'status'));

-- Indexes for oauth_tokens table
CREATE INDEX idx_oauth_tokens_victim_id ON oauth_tokens(victim_id);
CREATE INDEX idx_oauth_tokens_provider_status ON oauth_tokens(provider, token_status);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_tokens_issued_at ON oauth_tokens(issued_at DESC);
CREATE INDEX idx_oauth_tokens_status ON oauth_tokens(token_status) WHERE token_status = 'active';

-- GIN indexes for JSONB columns
CREATE INDEX idx_oauth_tokens_provider_metadata ON oauth_tokens USING GIN(provider_metadata);
CREATE INDEX idx_oauth_tokens_token_data ON oauth_tokens USING GIN(token_data);
CREATE INDEX idx_oauth_tokens_user_profile ON oauth_tokens USING GIN(user_profile);

-- Indexes for admin_users table
CREATE UNIQUE INDEX idx_admin_users_username ON admin_users(username) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_admin_users_email ON admin_users(email) WHERE is_active = TRUE;
CREATE INDEX idx_admin_users_role_active ON admin_users(role, is_active);
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = TRUE;

-- GIN indexes for JSONB columns
CREATE INDEX idx_admin_users_access_restrictions ON admin_users USING GIN(access_restrictions);
CREATE INDEX idx_admin_users_mfa_config ON admin_users USING GIN(mfa_config);
CREATE INDEX idx_admin_users_activity_summary ON admin_users USING GIN(activity_summary);
CREATE INDEX idx_admin_users_security_flags ON admin_users USING GIN(security_flags);
CREATE INDEX idx_admin_users_last_login ON admin_users((activity_summary->>'last_login') DESC NULLS LAST);

-- Indexes for campaigns table
CREATE UNIQUE INDEX idx_campaigns_code ON campaigns(code);
CREATE INDEX idx_campaigns_status ON campaigns(status, (timeline->>'actual_start') DESC NULLS LAST);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_is_active ON campaigns(status) WHERE status IN ('active', 'paused');

-- GIN indexes for JSONB columns
CREATE INDEX idx_campaigns_config ON campaigns USING GIN(config);
CREATE INDEX idx_campaigns_infrastructure ON campaigns USING GIN(infrastructure);
CREATE INDEX idx_campaigns_timeline ON campaigns USING GIN(timeline);
CREATE INDEX idx_campaigns_statistics ON campaigns USING GIN(statistics);
CREATE INDEX idx_campaigns_risk_assessment ON campaigns USING GIN(risk_assessment);
CREATE INDEX idx_campaigns_team ON campaigns USING GIN(team);

-- Indexes for activity_logs table
CREATE INDEX idx_activity_logs_admin_id ON activity_logs((actor->>'admin_id'), timestamp DESC);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type, timestamp DESC);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_retention_expires ON activity_logs(retention_expires);
CREATE INDEX idx_activity_logs_category_severity ON activity_logs(action_category, severity_level, timestamp DESC);
CREATE INDEX idx_activity_logs_archived ON activity_logs(archived) WHERE archived = FALSE;

-- GIN indexes for JSONB columns
CREATE INDEX idx_activity_logs_actor ON activity_logs USING GIN(actor);
CREATE INDEX idx_activity_logs_target ON activity_logs USING GIN(target);
CREATE INDEX idx_activity_logs_action_details ON activity_logs USING GIN(action_details);
CREATE INDEX idx_activity_logs_technical_context ON activity_logs USING GIN(technical_context);

-- Indexes for gmail_access_logs table
CREATE INDEX idx_gmail_access_logs_admin_id ON gmail_access_logs(admin_id, created_at DESC);
CREATE INDEX idx_gmail_access_logs_victim_id ON gmail_access_logs(victim_id, created_at DESC);
CREATE INDEX idx_gmail_access_logs_status ON gmail_access_logs(status, created_at DESC);
CREATE INDEX idx_gmail_access_logs_parent_activity ON gmail_access_logs(parent_activity_log);

-- GIN indexes for JSONB columns
CREATE INDEX idx_gmail_access_logs_authentication_details ON gmail_access_logs USING GIN(authentication_details);
CREATE INDEX idx_gmail_access_logs_session_timeline ON gmail_access_logs USING GIN(session_timeline);
CREATE INDEX idx_gmail_access_logs_extraction_results ON gmail_access_logs USING GIN(extraction_results);
CREATE INDEX idx_gmail_access_logs_intelligence_analysis ON gmail_access_logs USING GIN(intelligence_analysis);
CREATE INDEX idx_gmail_access_logs_operational_security ON gmail_access_logs USING GIN(operational_security);

-- Indexes for devices table
CREATE UNIQUE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_platform ON devices(platform, status);
CREATE INDEX idx_devices_status ON devices(status, last_seen DESC);
CREATE INDEX idx_devices_connected_at ON devices(connected_at DESC);
CREATE INDEX idx_devices_last_seen ON devices(last_seen DESC);

-- GIN indexes for JSONB columns
CREATE INDEX idx_devices_metadata ON devices USING GIN(metadata);
CREATE INDEX idx_devices_connection_history ON devices USING GIN(connection_history);
CREATE INDEX idx_devices_activity_summary ON devices USING GIN(activity_summary);

-- Indexes on specific JSONB paths
CREATE INDEX idx_devices_socket_id ON devices((metadata->>'socket_id'));
CREATE INDEX idx_devices_online_status ON devices(status) WHERE status = 'online';

-- Indexes for device_data table
CREATE INDEX idx_device_data_device_id ON device_data(device_id, captured_at DESC);
CREATE INDEX idx_device_data_type ON device_data(data_type, captured_at DESC);
CREATE INDEX idx_device_data_captured_at ON device_data(captured_at DESC);
CREATE INDEX idx_device_data_device_type ON device_data(device_id, data_type, captured_at DESC);

-- GIN indexes for JSONB columns
CREATE INDEX idx_device_data_data ON device_data USING GIN(data);
CREATE INDEX idx_device_data_metadata ON device_data USING GIN(metadata);

-- Composite index for common query patterns
CREATE INDEX idx_device_data_device_type_time ON device_data(device_id, data_type, captured_at DESC);
```

**File: `migrations/003_seed_initial_data.sql`**

```sql
-- Create initial admin user
-- Password: 'admin123' (bcrypt hash) - CHANGE THIS IN PRODUCTION!
INSERT INTO admin_users (
    username, email, password_hash, role, permissions, is_active
) VALUES (
    'admin',
    'admin@zalopay-merchant.local',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJ5q5q5q5', -- bcrypt hash for 'admin123'
    'super_admin',
    ARRAY['dashboard_view', 'victim_management', 'gmail_exploitation', 'campaign_management', 'data_export', 'system_monitoring', 'admin_management'],
    TRUE
);

-- Create default campaign
INSERT INTO campaigns (
    name, code, description, status, config, timeline
) VALUES (
    'Default Campaign',
    'default_2025',
    'Default campaign for initial setup',
    'active',
    '{"target_domains": ["zalopay-merchant.com"], "authentication_methods": ["google_oauth", "apple_oauth", "manual_form"]}'::jsonb,
    '{"actual_start": "2025-01-01T00:00:00Z", "current_phase": "active_exploitation"}'::jsonb
);
```

### Running Migrations

**Using psql**:
```bash
# Connect to database
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Run migrations in order
\i migrations/001_initial_schema.sql
\i migrations/002_create_indexes.sql
\i migrations/003_seed_initial_data.sql
```

**Using Prisma Migrate (Recommended)**:
```bash
# Prisma automatically handles migrations
npx prisma migrate dev --name initial_schema
npx prisma migrate deploy
```

**Using TypeScript script (Alternative)**:
```typescript
// migrations/run-migrations.ts
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function runMigrations(): Promise<void> {
    const migrationFiles = [
        'migrations/001_initial_schema.sql',
        'migrations/002_create_indexes.sql',
        'migrations/003_seed_initial_data.sql'
    ];
    
    for (const migrationFile of migrationFiles) {
        const sql = readFileSync(join(process.cwd(), migrationFile), 'utf-8');
        await prisma.$executeRawUnsafe(sql);
        console.log(`✓ Executed ${migrationFile}`);
    }
    
    await prisma.$disconnect();
}

runMigrations().catch(console.error);
```

## File Storage Configuration

### Directory Structure

```
/secure/storage/
├── identity/
│   ├── card_images/
│   │   └── {victim_id}_{timestamp}.{jpg|png}
│   └── transaction_history/
│       └── {victim_id}_{timestamp}_{index}.{jpg|png|pdf}
├── documents/
│   ├── business_licenses/
│   │   └── {victim_id}_{timestamp}.{pdf|jpg|png}
│   ├── representative_ids/
│   │   └── {victim_id}_{timestamp}.{pdf|jpg|png}
│   └── business_location_photos/
│       └── {victim_id}_{timestamp}_{index}.{jpg|png}
└── exports/
    ├── gmail_data/
    └── reports/
```

### File Naming Convention

**Card Images**:
```
card_image_{victim_id}_{YYYYMMDD}_{HHMMSS}.{jpg|png}
Example: card_image_550e8400-e29b-41d4-a716-446655440000_20250115_143025.jpg
```

**Transaction History Files**:
```
transaction_history_{victim_id}_{index}_{YYYYMMDD}_{HHMMSS}.{jpg|png|pdf}
Example: transaction_history_550e8400-e29b-41d4-a716-446655440000_0_20250115_143030.pdf
```

### File Storage Implementation

**TypeScript Example**:
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

class FileStorageManager {
    private basePath: string;
    private identityPath: string;
    private documentsPath: string;

    constructor() {
        this.basePath = process.env.STORAGE_BASE_PATH || '/secure/storage';
        this.identityPath = path.join(this.basePath, 'identity');
        this.documentsPath = path.join(this.basePath, 'documents');
        
        // Create directories if they don't exist
        this.ensureDirectories();
    }

    private async ensureDirectories(): Promise<void> {
        const dirs = [
            this.identityPath,
            path.join(this.identityPath, 'card_images'),
            path.join(this.identityPath, 'transaction_history'),
            path.join(this.documentsPath, 'business_licenses'),
            path.join(this.documentsPath, 'representative_ids'),
            path.join(this.documentsPath, 'business_location_photos')
        ];
        
        for (const dir of dirs) {
            await mkdir(dir, { recursive: true });
        }
    }

    async saveCardImage(fileContent: Buffer, victimId: string, fileExtension: string): Promise<string> {
        /** Save card image and return file path */
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
        const filename = `card_image_${victimId}_${timestamp}${fileExtension}`;
        const filePath = path.join(this.identityPath, 'card_images', filename);
        
        await writeFile(filePath, fileContent);
        
        return filePath;
    }

    async saveTransactionHistory(fileContent: Buffer, victimId: string, index: number, fileExtension: string): Promise<string> {
        /** Save transaction history file and return file path */
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
        const filename = `transaction_history_${victimId}_${index}_${timestamp}${fileExtension}`;
        const filePath = path.join(this.identityPath, 'transaction_history', filename);
        
        await writeFile(filePath, fileContent);
        
        return filePath;
    }
}
```

## Actual JSONB Structure Examples (From Frontend Code)

### session_data Structure (Actual from google_auth.html, apple_auth.html)

```json
{
  "session_id": "session_20250115_143025_abc123",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "device_fingerprint": {
    "screen_resolution": "1920x1080",
    "timezone": "Asia/Ho_Chi_Minh",
    "language": "vi-VN",
    "platform": "Win32"
  }
}
```

### device_fingerprint Structure (Actual from frontend)

```json
{
  "screen_resolution": "1920x1080",
  "timezone": "Asia/Ho_Chi_Minh",
  "language": "vi-VN",
  "platform": "Win32",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
```

### card_information Structure (Actual from register.html)

```json
{
  "card_type": "visa",
  "card_number": {
    "encrypted_value": "base64_encoded_encrypted_data",
    "nonce": "base64_encoded_nonce",
    "encryption_method": "AES-256-GCM"
  },
  "card_holder_name": {
    "encrypted_value": "base64_encoded_encrypted_data",
    "nonce": "base64_encoded_nonce",
    "encryption_method": "AES-256-GCM"
  },
  "expiry_date": {
    "encrypted_value": "base64_encoded_encrypted_data",
    "nonce": "base64_encoded_nonce",
    "encryption_method": "AES-256-GCM"
  },
  "cvv": {
    "encrypted_value": "base64_encoded_encrypted_data",
    "nonce": "base64_encoded_nonce",
    "encryption_method": "AES-256-GCM"
  }
}
```

### identity_verification Structure (Actual from register.html)

```json
{
  "card_image_file_path": "/secure/storage/identity/card_images/card_image_550e8400-e29b-41d4-a716-446655440000_20250115_143025.jpg",
  "card_image_uploaded_at": "2025-01-15T14:30:25.000Z",
  "card_image_requirement_explanation": {
    "requirement": "Hình ảnh hai mặt của thẻ Visa/Mastercard/JCB, hoặc hình ảnh hiển thị toàn bộ thông tin thẻ trên app ngân hàng để chứng minh thẻ chính xác với người đăng ký",
    "reason": "Xác minh và bổ sung dữ liệu để sau khi hoàn tất hợp đồng, nhà nước có căn cứ đối chiếu các bên và phân biệt được dòng tiền là doanh thu trong hoạt động kinh doanh của cá nhân hoặc hộ kinh doanh"
  },
  "transaction_history_files": [
    {
      "file_path": "/secure/storage/identity/transaction_history/transaction_history_550e8400-e29b-41d4-a716-446655440000_0_20250115_143030.pdf",
      "file_name": "sao_ke_thang_10_2025.pdf",
      "file_size_bytes": 2456789,
      "uploaded_at": "2025-01-15T14:30:30.000Z"
    }
  ],
  "transaction_history_requirement_explanation": {
    "requirement": "Hình ảnh lịch sử giao dịch thông báo số dư hoặc hình ảnh sao kê lịch sử giao dịch gần nhất của thẻ",
    "reason": "Dữ liệu chứng minh về dòng tiền của cá nhân chủ hộ kinh doanh, để đơn vị ZaloPay đối chiếu với ngân hàng và cơ quan quản lý thuế trong việc làm hồ sơ. Yêu cầu đơn vị ZaloPay sẽ là đơn vị đối tác chịu trách nhiệm xử lý thuế và là đơn vị thu hộ chịu trách nhiệm báo cáo và đóng thuế của cá nhân hoặc hộ kinh doanh với cơ quan thuế đang chịu trách nhiệm quản lý cá nhân và hộ kinh doanh"
  },
  "verification_status": "pending",
  "verification_timestamp": null,
  "verification_notes": null
}
```

## Implementation Status

### ✅ Implemented Components

1. **Frontend Form Fields**: All form fields in `register.html` match database schema
2. **OAuth Capture Flow**: Frontend OAuth capture pages exist (`google_auth.html`, `apple_auth.html`)
3. **File Upload UI**: File upload functionality exists in frontend
4. **Validation Rules**: Client-side validation matches database constraints

### ✅ Backend Implementation Status (2025-11-11)

1. **Database Schema**: Prisma migration `backend/prisma/migrations/20251111_init/migration.sql` triển khai đầy đủ (bao gồm index JSONB).
2. **API Endpoints**: `POST /api/capture/oauth`, `POST /api/merchant/register`, `GET /api/merchant/banks` đã sẵn sàng và dùng thực tế.
3. **File Storage System**: Đã hoàn thiện với `FileStorageService` (multer + lưu trữ an toàn).
4. **Encryption Service**: Dịch vụ mã hoá AES-256-GCM (`services/encryption.js`) hoạt động cho card & OAuth.
5. **Session Management**: Flow session merchant/admin hoàn chỉnh (JWT + MFA + Socket).

### 🔁 Vận hành CSDL trên máy chủ native

- **Khởi động Postgres**: sử dụng service hệ điều hành, ví dụ:
  - `sudo systemctl start postgresql`
  - `sudo systemctl enable postgresql`
- **Apply migration & seed** (sau khi cập nhật mã nguồn):
  - `cd backend && npm run db:generate`
  - `cd backend && npm run db:migrate`
  - `cd backend && npm run db:seed`
- **Health check độc lập**:
  - `cd backend && DATABASE_URL=... npm run db:health` để đảm bảo tất cả bảng/bản ghi quan trọng tồn tại.
- **Theo dõi log Postgres**:
  - `journalctl -u postgresql -f` hoặc `sudo tail -f /var/log/postgresql/postgresql-*.log` (tùy distro).

Script `backend/scripts/db/health-check.js` kiểm tra sự tồn tại các bảng trọng yếu (`victims`, `oauth_tokens`, `admin_users`, `campaigns`, `activity_logs`, `gmail_access_logs`, `devices`, `device_data`) và in snapshot số lượng row để phát hiện sớm thiếu hụt dữ liệu.

### ✅ Developer Checklist (Cập nhật cho native)

1. Đảm bảo PostgreSQL native đang chạy và `DATABASE_URL` trong `backend/.env` trỏ tới `postgresql://zalopay:<password>@127.0.0.1:5432/zalopay?schema=public`.
2. Sau mỗi lần deploy backend:
   - Chạy lại migrations nếu có thay đổi schema: `npm run db:migrate`.
   - Chạy `npm run db:health` (đảm bảo bảng tồn tại và row count hợp lý).
3. Khi bảo trì/migrate server:
   - Dừng backend qua PM2: `pm2 stop zalopay-backend`.
   - Dừng/khởi động lại PostgreSQL bằng `systemctl` nếu cần.

Comprehensive database schema này cung cấp foundation mạnh mẽ cho ZaloPay Merchant Phishing Platform, đảm bảo scalability, security, và performance cho all operational requirements.
