-- Migration: Add Facebook OAuth support
-- Description: Refactor users table to support multiple OAuth providers
-- Author: Claude Code
-- Date: 2024-07-20

BEGIN;

-- Add new columns for multi-provider support
ALTER TABLE users ADD COLUMN provider VARCHAR(20) DEFAULT 'google';
ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);

-- Migrate existing Google users
UPDATE users SET provider_id = google_id WHERE provider_id IS NULL;

-- Add composite unique constraint for provider + provider_id
ALTER TABLE users ADD CONSTRAINT unique_provider_user UNIQUE (provider, provider_id);

-- Make provider_id NOT NULL after data migration
ALTER TABLE users ALTER COLUMN provider_id SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_users_provider_id ON users(provider, provider_id);

-- Remove old google_id column (commented out for safety - run manually)
-- ALTER TABLE users DROP COLUMN google_id;

COMMIT;

-- Rollback script (run if migration needs to be reverted):
-- BEGIN;
-- ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
-- UPDATE users SET google_id = provider_id WHERE provider = 'google';
-- ALTER TABLE users DROP CONSTRAINT unique_provider_user;
-- DROP INDEX idx_users_provider_id;
-- ALTER TABLE users DROP COLUMN provider;
-- ALTER TABLE users DROP COLUMN provider_id;
-- COMMIT;