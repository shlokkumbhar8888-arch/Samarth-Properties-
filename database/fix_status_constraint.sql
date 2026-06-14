-- ============================================================
-- FIX: Add 'available' to projects status CHECK constraint
-- Run this in Supabase SQL Editor → New Query
-- ============================================================

-- Drop the existing constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Add the updated constraint with 'available' included
ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('available', 'ongoing', 'completed', 'upcoming'));

-- Verify
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'projects'::regclass AND contype = 'c';
