-- Add permissions column to roles table
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS permissions TEXT;

