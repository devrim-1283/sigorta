-- Add deleted_at column to documents table if it doesn't exist
-- This migration adds soft delete support to the documents table

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE documents 
        ADD COLUMN deleted_at TIMESTAMP NULL;
        
        -- Add index for better query performance
        CREATE INDEX IF NOT EXISTS idx_documents_deleted_at 
        ON documents(deleted_at);
        
        RAISE NOTICE 'Column deleted_at added to documents table';
    ELSE
        RAISE NOTICE 'Column deleted_at already exists in documents table';
    END IF;
END $$;

