import { getDbPool } from './db-connection.js';

export interface ModelDiagnosticResult {
    study_id: string;
    study_name: string;
    study_title: string | null;
    has_site: boolean;
    has_protocol: boolean;
    has_protocol_version: boolean;
    has_organization: boolean;
    has_site_protocol_version: boolean;
    has_study_configuration: boolean;
    has_availability: boolean;
    has_patient_info: boolean;
    study_configuration_size: number | null;
    availability_size: number | null;
    patient_info_size: number | null;
    issues: string[];
}

/**
 * Comprehensive diagnostic check for study model synchronization
 * Returns detailed information about each study's model unit status
 */
export async function diagnoseModelSync(): Promise<ModelDiagnosticResult[]> {
    const pool = getDbPool();
    
    const query = `
        WITH study_diagnostics AS (
            SELECT 
                s.study_id,
                s.name as study_name,
                s.title as study_title,
                -- Check for required records
                CASE WHEN st.site_id IS NOT NULL THEN true ELSE false END as has_site,
                CASE WHEN pr.protocol_id IS NOT NULL THEN true ELSE false END as has_protocol,
                CASE WHEN pv.protocol_version_id IS NOT NULL THEN true ELSE false END as has_protocol_version,
                CASE WHEN o.org_id IS NOT NULL THEN true ELSE false END as has_organization,
                CASE WHEN spv.site_id IS NOT NULL THEN true ELSE false END as has_site_protocol_version,
                -- Check for model unit data
                CASE WHEN spv.study_configuration IS NOT NULL THEN true ELSE false END as has_study_configuration,
                CASE WHEN o.staff_availability IS NOT NULL THEN true ELSE false END as has_availability,
                CASE WHEN st.patient_availability_and_history IS NOT NULL THEN true ELSE false END as has_patient_info,
                -- Get data sizes
                CASE WHEN spv.study_configuration IS NOT NULL 
                    THEN LENGTH(spv.study_configuration::text) 
                    ELSE NULL END as study_configuration_size,
                CASE WHEN o.staff_availability IS NOT NULL 
                    THEN LENGTH(o.staff_availability::text) 
                    ELSE NULL END as availability_size,
                CASE WHEN st.patient_availability_and_history IS NOT NULL 
                    THEN LENGTH(st.patient_availability_and_history::text) 
                    ELSE NULL END as patient_info_size
            FROM study s
            LEFT JOIN site st ON s.study_id = st.study_id
            LEFT JOIN organization o ON st.org_id = o.org_id
            LEFT JOIN protocol pr ON s.study_id = pr.study_id
            LEFT JOIN protocol_version pv ON pr.protocol_id = pv.protocol_id
            LEFT JOIN site_protocol_versions spv ON st.site_id = spv.site_id 
                AND pv.protocol_version_id = spv.protocol_version_id
        )
        SELECT * FROM study_diagnostics
        ORDER BY study_name;
    `;
    
    const result = await pool.query(query);
    
    return result.rows.map(row => {
        const issues: string[] = [];
        
        // Check for missing critical records
        if (!row.has_site) {
            issues.push('Missing site record');
        }
        if (!row.has_protocol) {
            issues.push('Missing protocol record');
        }
        if (!row.has_protocol_version) {
            issues.push('Missing protocol_version record');
        }
        if (!row.has_organization) {
            issues.push('Missing organization record');
        }
        if (!row.has_site_protocol_version) {
            issues.push('Missing site_protocol_versions record');
        }
        
        // Check for missing model units (only if records exist)
        if (row.has_site_protocol_version && !row.has_study_configuration) {
            issues.push('Missing StudyConfiguration model data');
        }
        if (row.has_organization && !row.has_availability) {
            issues.push('Missing Availability model data');
        }
        if (row.has_site && !row.has_patient_info) {
            issues.push('Missing PatientInfo model data');
        }
        
        return {
            study_id: row.study_id,
            study_name: row.study_name,
            study_title: row.study_title,
            has_site: row.has_site,
            has_protocol: row.has_protocol,
            has_protocol_version: row.has_protocol_version,
            has_organization: row.has_organization,
            has_site_protocol_version: row.has_site_protocol_version,
            has_study_configuration: row.has_study_configuration,
            has_availability: row.has_availability,
            has_patient_info: row.has_patient_info,
            study_configuration_size: row.study_configuration_size,
            availability_size: row.availability_size,
            patient_info_size: row.patient_info_size,
            issues
        };
    });
}

/**
 * Get studies with model sync issues
 */
export async function getStudiesWithIssues(): Promise<ModelDiagnosticResult[]> {
    const allResults = await diagnoseModelSync();
    return allResults.filter(result => result.issues.length > 0);
}

/**
 * Get summary statistics of model sync status
 */
export async function getModelSyncSummary() {
    const results = await diagnoseModelSync();
    
    return {
        total_studies: results.length,
        studies_with_issues: results.filter(r => r.issues.length > 0).length,
        missing_site: results.filter(r => !r.has_site).length,
        missing_protocol: results.filter(r => !r.has_protocol).length,
        missing_protocol_version: results.filter(r => !r.has_protocol_version).length,
        missing_organization: results.filter(r => !r.has_organization).length,
        missing_site_protocol_version: results.filter(r => !r.has_site_protocol_version).length,
        missing_study_configuration: results.filter(r => r.has_site_protocol_version && !r.has_study_configuration).length,
        missing_availability: results.filter(r => r.has_organization && !r.has_availability).length,
        missing_patient_info: results.filter(r => r.has_site && !r.has_patient_info).length,
    };
}
