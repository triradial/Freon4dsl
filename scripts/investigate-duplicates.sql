-- ============================================================================
-- Investigate Duplicate site_protocol_versions
-- ============================================================================

DO $$ BEGIN
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'Investigating site_protocol_versions Duplicates';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE '';
END $$;

DO $$ BEGIN
    RAISE NOTICE '1. Total counts:';
    RAISE NOTICE '---------------------------------------';
END $$;

SELECT 
    (SELECT COUNT(*) FROM study) as total_studies,
    (SELECT COUNT(*) FROM site) as total_sites,
    (SELECT COUNT(*) FROM protocol) as total_protocols,
    (SELECT COUNT(*) FROM protocol_version) as total_protocol_versions,
    (SELECT COUNT(*) FROM site_protocol_versions) as total_site_protocol_versions;

DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '2. All site_protocol_versions records with study info:';
    RAISE NOTICE '---------------------------------------';
END $$;

SELECT 
    spv.site_id,
    spv.protocol_version_id,
    s.study_id,
    s.name as study_name,
    st.site_number,
    pv.version as protocol_version,
    CASE WHEN spv.study_configuration IS NULL THEN 'NULL' ELSE 'Has Data' END as study_config
FROM site_protocol_versions spv
JOIN site st ON spv.site_id = st.site_id
JOIN study s ON st.study_id = s.study_id
JOIN protocol pr ON s.study_id = pr.study_id
JOIN protocol_version pv ON spv.protocol_version_id = pv.protocol_version_id
ORDER BY s.name, spv.site_id, spv.protocol_version_id;

DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '3. Checking for duplicate (site_id, protocol_version_id) combinations:';
    RAISE NOTICE '---------------------------------------';
END $$;

SELECT 
    site_id,
    protocol_version_id,
    COUNT(*) as duplicate_count
FROM site_protocol_versions
GROUP BY site_id, protocol_version_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '4. Sites with multiple protocol_versions:';
    RAISE NOTICE '---------------------------------------';
END $$;

SELECT 
    st.site_id,
    s.study_id,
    s.name as study_name,
    COUNT(spv.protocol_version_id) as protocol_version_count
FROM site st
JOIN study s ON st.study_id = s.study_id
LEFT JOIN site_protocol_versions spv ON st.site_id = spv.site_id
GROUP BY st.site_id, s.study_id, s.name
HAVING COUNT(spv.protocol_version_id) > 1
ORDER BY protocol_version_count DESC;

DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '5. Studies with multiple protocol_versions:';
    RAISE NOTICE '---------------------------------------';
END $$;

SELECT 
    s.study_id,
    s.name as study_name,
    COUNT(pv.protocol_version_id) as version_count
FROM study s
LEFT JOIN protocol pr ON s.study_id = pr.study_id
LEFT JOIN protocol_version pv ON pr.protocol_id = pv.protocol_id
GROUP BY s.study_id, s.name
HAVING COUNT(pv.protocol_version_id) > 1
ORDER BY version_count DESC;

DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '6. Checking for unique constraint on site_protocol_versions:';
    RAISE NOTICE '---------------------------------------';
END $$;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'site_protocol_versions'::regclass
ORDER BY conname;

DO $$ BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'End of Investigation';
    RAISE NOTICE '================================================================================';
END $$;
