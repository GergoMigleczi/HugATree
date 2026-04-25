-- 007_admin_flag.sql
-- Adds an admin_flag column to users so we can identify administrators.

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admin_flag BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
