-- Migration: Add CASCADE DELETE for site and site_persons relationships
-- Purpose: Automatically delete site_persons when sites are deleted, 
--          and automatically delete sites when studies are deleted

-- Step 1: Drop existing foreign key constraints if they exist
DO $$ 
BEGIN
    -- Drop site.study_id foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'site_study_id_fkey' 
        AND table_name = 'site'
    ) THEN
        ALTER TABLE site DROP CONSTRAINT site_study_id_fkey;
    END IF;

    -- Drop site_persons.site_id foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'site_persons_site_id_fkey' 
        AND table_name = 'site_persons'
    ) THEN
        ALTER TABLE site_persons DROP CONSTRAINT site_persons_site_id_fkey;
    END IF;
END $$;

-- Step 2: Add foreign key constraints WITH CASCADE DELETE

-- Add CASCADE DELETE for site -> study relationship
-- When a study is deleted, all its sites are automatically deleted
ALTER TABLE site
    ADD CONSTRAINT site_study_id_fkey 
    FOREIGN KEY (study_id) 
    REFERENCES study(study_id) 
    ON DELETE CASCADE;

-- Add CASCADE DELETE for site_persons -> site relationship
-- When a site is deleted, all site_persons entries are automatically deleted
ALTER TABLE site_persons
    ADD CONSTRAINT site_persons_site_id_fkey 
    FOREIGN KEY (site_id) 
    REFERENCES site(site_id) 
    ON DELETE CASCADE;

-- Add helpful comment
COMMENT ON CONSTRAINT site_study_id_fkey ON site IS 
    'CASCADE: Deleting a study automatically deletes all its sites';

COMMENT ON CONSTRAINT site_persons_site_id_fkey ON site_persons IS 
    'CASCADE: Deleting a site automatically deletes all site_persons entries';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Migration complete: CASCADE DELETE constraints added for site and site_persons';
END $$;
