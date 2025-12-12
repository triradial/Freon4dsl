-- ============================================================================
-- Cleanup Duplicate site_protocol_versions
-- ============================================================================
-- WARNING: This will DELETE duplicate records!
-- Run investigate-duplicates.sql first to understand what duplicates exist
-- ============================================================================

DO $$ BEGIN
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'Cleaning Up Duplicate site_protocol_versions';
    RAISE NOTICE 'WARNING: This will delete duplicate records!';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '';
END $$;

-- Start transaction
BEGIN;

DO $$ BEGIN
    RAISE NOTICE 'Deleting duplicate site_protocol_versions records...';
    RAISE NOTICE 'Keeping the record with study_configuration data if it exists...';
    RAISE NOTICE '';
END $$;

-- For each (site_id, protocol_version_id) combination, keep only ONE record
-- Prefer keeping the one WITH study_configuration data
DELETE FROM site_protocol_versions
WHERE (site_id, protocol_version_id, COALESCE(study_configuration IS NULL, true)) IN (
    SELECT site_id, protocol_version_id, COALESCE(study_configuration IS NULL, true)
    FROM (
        SELECT 
            site_id,
            protocol_version_id,
            study_configuration,
            ROW_NUMBER() OVER (
                PARTITION BY site_id, protocol_version_id 
                ORDER BY 
                    CASE WHEN study_configuration IS NOT NULL THEN 0 ELSE 1 END,  -- Prefer records WITH data
                    CASE WHEN study_configuration IS NOT NULL THEN length(study_configuration::text) ELSE 0 END DESC  -- Prefer larger data
            ) as rn
        FROM site_protocol_versions
    ) ranked
    WHERE rn > 1  -- Keep first, delete rest
);

-- Show what's left
DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Remaining records:';
    RAISE NOTICE '---------------------------------------';
END $$;

SELECT 
    (SELECT COUNT(*) FROM site_protocol_versions) as remaining_site_protocol_versions,
    (SELECT COUNT(*) FROM study) as total_studies,
    (SELECT COUNT(*) FROM site) as total_sites;

-- Commit
COMMIT;

DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Cleanup complete!';
    RAISE NOTICE 'Run preview script again to verify everything is correct.';
    RAISE NOTICE '';
END $$;
