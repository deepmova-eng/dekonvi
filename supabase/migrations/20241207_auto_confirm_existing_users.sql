-- Auto-confirm existing users before implementing strict validation mode
-- This prevents locking out current users who registered before the new validation workflow

-- Update all users with NULL email_confirmed_at to be confirmed
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, created_at),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Add comment for documentation
COMMENT ON TABLE auth.users IS 'Migration applied: Auto-confirmed existing users on 2024-12-07 before strict validation mode';
