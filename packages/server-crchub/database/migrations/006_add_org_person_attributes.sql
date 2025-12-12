-- Migration: Add org_person_attributes JSONB column to org_persons table
-- This column will store person-specific attributes like unavailable dates

-- Add org_person_attributes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'org_persons' 
        AND column_name = 'org_person_attributes'
    ) THEN
        ALTER TABLE org_persons 
        ADD COLUMN org_person_attributes JSONB DEFAULT '{}'::jsonb;
        
        RAISE NOTICE 'Added org_person_attributes column to org_persons table';
    ELSE
        RAISE NOTICE 'org_person_attributes column already exists';
    END IF;
END $$;

-- Create an index on the JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_org_person_attributes_unavailable 
ON org_persons USING gin ((org_person_attributes -> 'unavailable'));

COMMENT ON COLUMN org_persons.org_person_attributes IS 
'JSONB column for storing person-specific attributes at the organization level. Example: {"unavailable": ["2025-12-20", "2025-12-21"]}';

