-- Add admin role and audit columns to users table
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS admin_created_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS admin_created_by TEXT;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Ensure email_verification_requests has verified_at
ALTER TABLE IF EXISTS email_verification_requests
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Ensure kyc_requests has processed_at/verified columns if needed
ALTER TABLE IF EXISTS kyc_requests
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

