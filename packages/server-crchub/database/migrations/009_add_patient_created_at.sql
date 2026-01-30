-- Migration: Add created_at to patient table for ordering (newest first)
-- If column already exists, this is a no-op.

ALTER TABLE patient ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows that have null created_at
UPDATE patient SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
