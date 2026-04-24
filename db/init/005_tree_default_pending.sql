-- 005_tree_default_pending.sql
-- Change default approval status to pending so new trees require admin approval.

ALTER TABLE trees
  ALTER COLUMN approval_status SET DEFAULT 'pending';
