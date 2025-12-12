-- Script to load JSON files from studies folders into JSONB columns
-- This script identifies which studies have JSON files and provides UPDATE statements
-- Note: You'll need to read the JSON files and insert their content
-- For Azure PostgreSQL, you may need to use a script to read files and generate these UPDATEs

-- ============================================================================
-- IDENTIFY STUDIES WITH JSON FILES
-- ============================================================================

-- Studies that exist in database (from seed_studies_and_patients.sql):
-- facility-001: f47ac10b-58cc-4372-a567-0e02b2c3d479, e0b1dc36-07ee-4f0f-8ba6-8d9c69724c67,
--               46abda0c-51c3-473a-ad01-dacbc03d8639, 7e010ccb-0eee-405c-8ebb-8beb162c7b59,
--               024c3afb-0d38-438c-af3c-08b8be9f7d1d, 65a6658b-5772-4ee9-a139-4fd7c792291a,
--               5069dcf5-efea-429c-bc23-1d934fa5b7a9, 19e0d795-364e-49cf-aa09-f5ee808b4743,
--               0477e3f5-7c2e-45b8-a09c-d638f229d6bd, 456d72ce-da14-48b7-ba88-55b2cc9d9158,
--               53d865c0-be17-4d82-b1e6-5d4be9fe5e01, 3a7e9f8b-1c2d-4e5f-9e8b-6a7b8c9d0e1f
-- facility-002: f47ac10b-58cc-4372-a567-0e02b2c3d479 (shared), c134550f-359a-4254-829b-7b141340b403

-- Studies with StudyConfiguration.json files (15 total):
-- f47ac10b-58cc-4372-a567-0e02b2c3d479, e0b1dc36-07ee-4f0f-8ba6-8d9c69724c67,
-- 46abda0c-51c3-473a-ad01-dacbc03d8639, 7e010ccb-0eee-405c-8ebb-8beb162c7b59,
-- 024c3afb-0d38-438c-af3c-08b8be9f7d1d, 65a6658b-5772-4ee9-a139-4fd7c792291a,
-- 5069dcf5-efea-429c-bc23-1d934fa5b7a9, 19e0d795-364e-49cf-aa09-f5ee808b4743,
-- 0477e3f5-7c2e-45b8-a09c-d638f229d6bd, 456d72ce-da14-48b7-ba88-55b2cc9d9158,
-- 53d865c0-be17-4d82-b1e6-5d4be9fe5e01, c134550f-359a-4254-829b-7b141340b403,
-- ab7ac10b-58cc-4372-a567-0e02b2c3d479, 0b1cf035-635b-4132-8266-650f1578fc58, 80e7aeab-91e0-478d-a360-45c1bb2fad0f

-- Studies with Availability.json files (3 total):
-- 0b1cf035-635b-4132-8266-650f1578fc58, 11119f8b-1c2d-4e5f-9e8b-6a7b8c9d0e1f, 65a6658b-5772-4ee9-a139-4fd7c792291a

-- Studies with PatientInfo.json files (8 total):
-- 53d865c0-be17-4d82-b1e6-5d4be9fe5e01, 46abda0c-51c3-473a-ad01-dacbc03d8639,
-- 456d72ce-da14-48b7-ba88-55b2cc9d9158, 65a6658b-5772-4ee9-a139-4fd7c792291a,
-- 7e010ccb-0eee-405c-8ebb-8beb162c7b59, 80e7aeab-91e0-478d-a360-45c1bb2fad0f,
-- 5069dcf5-efea-429c-bc23-1d934fa5b7a9, 0477e3f5-7c2e-45b8-a09c-d638f229d6bd

-- ============================================================================
-- UPDATE site_protocol_versions.study_configuration
-- ============================================================================

-- For each study with StudyConfiguration.json, update the site_protocol_versions table
-- Template: Replace <JSON_CONTENT> with the actual JSON content from the file
-- Replace <STUDY_ID> with the study_id UUID

DO $$
DECLARE
    study_id_var UUID;
    site_protocol_rec RECORD;
    json_content TEXT;
BEGIN
    -- Loop through studies that have StudyConfiguration.json files
    FOR study_id_var IN 
        SELECT study_id FROM study 
        WHERE study_id IN (
            'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
            'e0b1dc36-07ee-4f0f-8ba6-8d9c69724c67'::uuid,
            '46abda0c-51c3-473a-ad01-dacbc03d8639'::uuid,
            '7e010ccb-0eee-405c-8ebb-8beb162c7b59'::uuid,
            '024c3afb-0d38-438c-af3c-08b8be9f7d1d'::uuid,
            '65a6658b-5772-4ee9-a139-4fd7c792291a'::uuid,
            '5069dcf5-efea-429c-bc23-1d934fa5b7a9'::uuid,
            '19e0d795-364e-49cf-aa09-f5ee808b4743'::uuid,
            '0477e3f5-7c2e-45b8-a09c-d638f229d6bd'::uuid,
            '456d72ce-da14-48b7-ba88-55b2cc9d9158'::uuid,
            '53d865c0-be17-4d82-b1e6-5d4be9fe5e01'::uuid,
            'c134550f-359a-4254-829b-7b141340b403'::uuid
        )
    LOOP
        -- Find site_protocol_versions for this study
        FOR site_protocol_rec IN
            SELECT spv.site_protocol_id, spv.site_id, spv.protocol_version_id
            FROM site_protocol_versions spv
            JOIN site s ON spv.site_id = s.site_id
            JOIN protocol_version pv ON spv.protocol_version_id = pv.protocol_version_id
            JOIN protocol p ON pv.protocol_id = p.protocol_id
            WHERE p.study_id = study_id_var
            ORDER BY spv.created_at DESC
            LIMIT 1  -- Get the most recent one
        LOOP
            -- Note: You need to read the StudyConfiguration.json file and replace this placeholder
            -- The JSON content should be loaded from: datastore/studies/<study_id>/StudyConfiguration.json
            -- For now, this is a placeholder - you'll need to use a script to read files and generate UPDATEs
            RAISE NOTICE 'Need to load StudyConfiguration.json for study % into site_protocol_id %', study_id_var, site_protocol_rec.site_protocol_id;
            
            -- Example UPDATE (uncomment and replace <JSON_CONTENT> with actual JSON):
            -- UPDATE site_protocol_versions 
            -- SET study_configuration = '<JSON_CONTENT>'::jsonb
            -- WHERE site_protocol_id = site_protocol_rec.site_protocol_id;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- UPDATE site.patient_availability_and_history
-- ============================================================================

-- For each study with PatientInfo.json, update the site table
DO $$
DECLARE
    study_id_var UUID;
    site_rec RECORD;
BEGIN
    -- Loop through studies that have PatientInfo.json files
    FOR study_id_var IN 
        SELECT study_id FROM study 
        WHERE study_id IN (
            '53d865c0-be17-4d82-b1e6-5d4be9fe5e01'::uuid,
            '46abda0c-51c3-473a-ad01-dacbc03d8639'::uuid,
            '456d72ce-da14-48b7-ba88-55b2cc9d9158'::uuid,
            '65a6658b-5772-4ee9-a139-4fd7c792291a'::uuid,
            '7e010ccb-0eee-405c-8ebb-8beb162c7b59'::uuid,
            '80e7aeab-91e0-478d-a360-45c1bb2fad0f'::uuid,
            '5069dcf5-efea-429c-bc23-1d934fa5b7a9'::uuid,
            '0477e3f5-7c2e-45b8-a09c-d638f229d6bd'::uuid
        )
    LOOP
        -- Find sites for this study
        FOR site_rec IN
            SELECT s.site_id
            FROM site s
            JOIN protocol_version pv ON s.protocol_version_id = pv.protocol_version_id
            JOIN protocol p ON pv.protocol_id = p.protocol_id
            WHERE p.study_id = study_id_var
        LOOP
            -- Note: You need to read the PatientInfo.json file and replace this placeholder
            -- The JSON content should be loaded from: datastore/studies/<study_id>/PatientInfo.json
            RAISE NOTICE 'Need to load PatientInfo.json for study % into site_id %', study_id_var, site_rec.site_id;
            
            -- Example UPDATE (uncomment and replace <JSON_CONTENT> with actual JSON):
            -- UPDATE site 
            -- SET patient_availability_and_history = '<JSON_CONTENT>'::jsonb
            -- WHERE site_id = site_rec.site_id;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- UPDATE organization.staff_availability
-- ============================================================================

-- For Availability.json files, these go to organization level
-- Note: 0b1cf035-635b-4132-8266-650f1578fc58 is NOT in the studies list, so it might be for a different study
-- or it might be organization-level availability data

-- Studies with Availability.json: 0b1cf035, 11119f8b, 65a6658b
-- Only 65a6658b exists in the database

DO $$
DECLARE
    study_id_var UUID;
    org_rec RECORD;
BEGIN
    -- For study 65a6658b-5772-4ee9-a139-4fd7c792291a which has Availability.json
    study_id_var := '65a6658b-5772-4ee9-a139-4fd7c792291a'::uuid;
    
    -- Find organizations that have this study
    FOR org_rec IN
        SELECT DISTINCT o.org_id, o.name
        FROM organization o
        JOIN org_study_roles osr ON o.org_id = osr.org_id
        WHERE osr.study_id = study_id_var
    LOOP
        -- Note: You need to read the Availability.json file and replace this placeholder
        -- The JSON content should be loaded from: datastore/studies/<study_id>/Availability.json
        RAISE NOTICE 'Need to load Availability.json for study % into organization % (%)', study_id_var, org_rec.name, org_rec.org_id;
        
        -- Example UPDATE (uncomment and replace <JSON_CONTENT> with actual JSON):
        -- UPDATE organization 
        -- SET staff_availability = '<JSON_CONTENT>'::jsonb
        -- WHERE org_id = org_rec.org_id;
    END LOOP;
END $$;

