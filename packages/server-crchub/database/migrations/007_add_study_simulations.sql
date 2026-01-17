-- Migration: Add study_simulations JSONB and study_simulations_sync BOOLEAN columns to site_protocol_versions table
-- These columns will store cached simulation results and track sync status with study_configuration

-- Add study_simulations column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'site_protocol_versions' 
        AND column_name = 'study_simulations'
    ) THEN
        ALTER TABLE site_protocol_versions 
        ADD COLUMN study_simulations JSONB;
        
        RAISE NOTICE 'Added study_simulations column to site_protocol_versions table';
    ELSE
        RAISE NOTICE 'study_simulations column already exists';
    END IF;
END $$;

-- Add study_simulations_sync column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'site_protocol_versions' 
        AND column_name = 'study_simulations_sync'
    ) THEN
        ALTER TABLE site_protocol_versions 
        ADD COLUMN study_simulations_sync BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Added study_simulations_sync column to site_protocol_versions table';
    ELSE
        RAISE NOTICE 'study_simulations_sync column already exists';
    END IF;
END $$;

-- Create an index on the JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_site_protocol_versions_study_simulations 
ON site_protocol_versions USING gin (study_simulations);

COMMENT ON COLUMN site_protocol_versions.study_simulations IS 
'JSONB column for storing cached Timeline simulation results. Contains serialized Timeline object used by Timeline Table, Timeline Chart, and Checklist views.';

COMMENT ON COLUMN site_protocol_versions.study_simulations_sync IS 
'Boolean flag tracking whether study_configuration and study_simulations are in sync. Set to false when study_configuration is saved, set to true when study_simulations is successfully saved.';
