-- Migration: Add platform support to devices table
-- Adds platform and platform_version columns to support both Android and iOS

-- Add platform column (android or ios)
ALTER TABLE devices ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'android';

-- Add platform_version column for detailed OS version
ALTER TABLE devices ADD COLUMN IF NOT EXISTS platform_version VARCHAR(255);

-- Create index for platform filtering
CREATE INDEX IF NOT EXISTS idx_devices_platform ON devices(platform);

-- Create composite index for platform and online status
CREATE INDEX IF NOT EXISTS idx_devices_platform_online ON devices(platform, online);

-- Update existing devices to have platform = 'android' (backward compatibility)
UPDATE devices SET platform = 'android' WHERE platform IS NULL;

-- Add comment to columns
COMMENT ON COLUMN devices.platform IS 'Device platform: android or ios';
COMMENT ON COLUMN devices.platform_version IS 'Detailed platform version (e.g., iOS 17.0, Android 13)';

