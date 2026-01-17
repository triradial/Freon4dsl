import { getDbPool } from './db-connection.js';

/**
 * Get StudyConfiguration for a study
 * StudyConfiguration is stored in site_protocol_versions.study_configuration
 */
export async function getStudyConfiguration(studyId: string): Promise<any | null> {
    const pool = getDbPool();
    
    console.log(`[model-service] getStudyConfiguration: studyId=${studyId}`);
    
    const result = await pool.query(
        `SELECT spv.study_configuration
         FROM site_protocol_versions spv
         JOIN site s ON spv.site_id = s.site_id
         JOIN protocol_version pv ON spv.protocol_version_id = pv.protocol_version_id
         JOIN protocol pr ON pv.protocol_id = pr.protocol_id
         JOIN study st ON pr.study_id = st.study_id
         WHERE st.study_id = $1
         LIMIT 1`,
        [studyId]
    );

    if (result.rows.length === 0 || !result.rows[0].study_configuration) {
        console.log(`[model-service] getStudyConfiguration: NO DATA for studyId=${studyId} (rows=${result.rows.length})`);
        return null;
    }

    const configPreview = JSON.stringify(result.rows[0].study_configuration).substring(0, 100);
    console.log(`[model-service] getStudyConfiguration: FOUND DATA for studyId=${studyId}, preview=${configPreview}...`);
    return result.rows[0].study_configuration;
}

/**
 * Save StudyConfiguration for a study
 */
export async function saveStudyConfiguration(studyId: string, configuration: any): Promise<boolean> {
    const pool = getDbPool();
    
    // Get or create site_protocol_version for this study
    const siteResult = await pool.query(
        `SELECT s.site_id, pv.protocol_version_id
         FROM study st
         LEFT JOIN site s ON st.study_id = s.study_id
         LEFT JOIN protocol pr ON st.study_id = pr.study_id
         LEFT JOIN protocol_version pv ON pr.protocol_id = pv.protocol_id
         WHERE st.study_id = $1
         LIMIT 1`,
        [studyId]
    );

    if (siteResult.rows.length === 0) {
        throw new Error(`Study not found: ${studyId}`);
    }

    const siteId = siteResult.rows[0].site_id;
    const protocolVersionId = siteResult.rows[0].protocol_version_id;

    if (!siteId) {
        throw new Error(`Site not found for study: ${studyId}`);
    }

    // Update or insert study_configuration and set study_simulations_sync = false
    const updateResult = await pool.query(
        `UPDATE site_protocol_versions
         SET study_configuration = $1, study_simulations_sync = false
         WHERE site_id = $2 AND protocol_version_id = $3`,
        [JSON.stringify(configuration), siteId, protocolVersionId]
    );

    if (updateResult.rowCount === 0) {
        // Insert if doesn't exist
        await pool.query(
            `INSERT INTO site_protocol_versions (site_id, protocol_version_id, study_configuration, study_simulations_sync)
             VALUES ($1, $2, $3, false)
             ON CONFLICT (site_id, protocol_version_id) DO UPDATE SET
                 study_configuration = EXCLUDED.study_configuration,
                 study_simulations_sync = false`,
            [siteId, protocolVersionId, JSON.stringify(configuration)]
        );
    }

    return true;
}

/**
 * Get Availability (staff availability) for a facility
 * Availability is stored in organization.staff_availability and is FACILITY-LEVEL (not study-level)
 * It's the same across all studies for a given facility/organization
 * 
 * Uses studyId to find the organization through: study -> site -> organization
 * Any studyId from the same facility will return the same availability
 */
export async function getAvailability(studyId: string): Promise<any | null> {
    const pool = getDbPool();
    
    console.log(`[model-service] getAvailability: studyId=${studyId}`);
    
    const result = await pool.query(
        `SELECT o.staff_availability
         FROM study st
         JOIN site s ON st.study_id = s.study_id
         JOIN organization o ON s.org_id = o.org_id
         WHERE st.study_id = $1
         LIMIT 1`,
        [studyId]
    );

    if (result.rows.length === 0 || !result.rows[0].staff_availability) {
        console.log(`[model-service] getAvailability: NO DATA for studyId=${studyId} (rows=${result.rows.length})`);
        return null;
    }

    const availabilityPreview = JSON.stringify(result.rows[0].staff_availability).substring(0, 100);
    console.log(`[model-service] getAvailability: FOUND DATA for studyId=${studyId}, preview=${availabilityPreview}...`);
    return result.rows[0].staff_availability;
}

/**
 * Save Availability (staff availability) for a facility
 * Availability is FACILITY-LEVEL (not study-level) - it's the same across all studies for a facility
 * 
 * Uses studyId to find the organization through: study -> site -> organization
 * Updates the organization's staff_availability, which applies to all studies in that facility
 * Any studyId from the same facility will update the same availability
 */
export async function saveAvailability(studyId: string, availability: any): Promise<boolean> {
    const pool = getDbPool();
    
    const result = await pool.query(
        `UPDATE organization
         SET staff_availability = $1
         FROM study st
         JOIN site s ON st.study_id = s.study_id
         WHERE s.org_id = organization.org_id
           AND st.study_id = $2`,
        [JSON.stringify(availability), studyId]
    );

    if (result.rowCount === 0) {
        throw new Error(`Organization not found for study: ${studyId}`);
    }

    return true;
}

/**
 * Get PatientInfo for a study
 * PatientInfo is stored in site.patient_availability_and_history
 */
export async function getPatientInfo(studyId: string): Promise<any | null> {
    const pool = getDbPool();
    
    console.log(`[model-service] getPatientInfo: studyId=${studyId}`);
    
    const result = await pool.query(
        `SELECT s.patient_availability_and_history
         FROM site s
         JOIN study st ON s.study_id = st.study_id
         WHERE st.study_id = $1
         LIMIT 1`,
        [studyId]
    );
    if (result.rows.length === 0 || !result.rows[0].patient_availability_and_history) {
        console.log(`[model-service] getPatientInfo: NO DATA for studyId=${studyId} (rows=${result.rows.length})`);
        return null;
    }
    const patientInfoPreview = JSON.stringify(result.rows[0].patient_availability_and_history).substring(0, 100);
    console.log(`[model-service] getPatientInfo: FOUND DATA for studyId=${studyId}, preview=${patientInfoPreview}...`);
    return result.rows[0].patient_availability_and_history;
}

/**
 * Save PatientInfo for a study
 */
export async function savePatientInfo(studyId: string, patientInfo: any): Promise<boolean> {
    const pool = getDbPool();
    
    // Get site for this study
    const siteResult = await pool.query(
        `SELECT s.site_id
         FROM site s
         JOIN study st ON s.study_id = st.study_id
         WHERE st.study_id = $1
         LIMIT 1`,
        [studyId]
    );

    if (siteResult.rows.length === 0) {
        throw new Error(`Site not found for study: ${studyId}`);
    }

    const siteId = siteResult.rows[0].site_id;

    const result = await pool.query(
        `UPDATE site
         SET patient_availability_and_history = $1
         WHERE site_id = $2`,
        [JSON.stringify(patientInfo), siteId]
    );

    return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get model unit (StudyConfiguration, Availability, or PatientInfo) by study ID and unit name
 */
export async function getModelUnit(studyId: string, unit: string): Promise<any | null> {
    const pool = getDbPool();
    
    switch (unit.toLowerCase()) {
        case 'studyconfiguration':
            return await getStudyConfiguration(studyId);
        case 'availability':
            return await getAvailability(studyId);
        case 'patientinfo':
            return await getPatientInfo(studyId);
        default:
            return null;
    }
}

/**
 * Get StudySimulation (cached Timeline) for a study
 * StudySimulation is stored in site_protocol_versions.study_simulations
 */
export async function getStudySimulation(studyId: string): Promise<any | null> {
    const pool = getDbPool();
    
    console.log(`[model-service] getStudySimulation: studyId=${studyId}`);
    
    const result = await pool.query(
        `SELECT spv.study_simulations
         FROM site_protocol_versions spv
         JOIN site s ON spv.site_id = s.site_id
         JOIN protocol_version pv ON spv.protocol_version_id = pv.protocol_version_id
         JOIN protocol pr ON pv.protocol_id = pr.protocol_id
         JOIN study st ON pr.study_id = st.study_id
         WHERE st.study_id = $1
         LIMIT 1`,
        [studyId]
    );

    if (result.rows.length === 0 || !result.rows[0].study_simulations) {
        console.log(`[model-service] getStudySimulation: NO DATA for studyId=${studyId} (rows=${result.rows.length})`);
        return null;
    }

    const simulationPreview = JSON.stringify(result.rows[0].study_simulations).substring(0, 100);
    console.log(`[model-service] getStudySimulation: FOUND DATA for studyId=${studyId}, preview=${simulationPreview}...`);
    return result.rows[0].study_simulations;
}

/**
 * Save StudySimulation (cached Timeline) for a study
 * Sets study_simulations_sync = true when successfully saved
 */
export async function saveStudySimulation(studyId: string, simulation: any): Promise<boolean> {
    const pool = getDbPool();
    
    // Get or create site_protocol_version for this study
    const siteResult = await pool.query(
        `SELECT s.site_id, pv.protocol_version_id
         FROM study st
         LEFT JOIN site s ON st.study_id = s.study_id
         LEFT JOIN protocol pr ON st.study_id = pr.study_id
         LEFT JOIN protocol_version pv ON pr.protocol_id = pv.protocol_id
         WHERE st.study_id = $1
         LIMIT 1`,
        [studyId]
    );

    if (siteResult.rows.length === 0) {
        throw new Error(`Study not found: ${studyId}`);
    }

    const siteId = siteResult.rows[0].site_id;
    const protocolVersionId = siteResult.rows[0].protocol_version_id;

    if (!siteId) {
        throw new Error(`Site not found for study: ${studyId}`);
    }

    // Update or insert study_simulations and set study_simulations_sync = true
    const updateResult = await pool.query(
        `UPDATE site_protocol_versions
         SET study_simulations = $1, study_simulations_sync = true
         WHERE site_id = $2 AND protocol_version_id = $3`,
        [JSON.stringify(simulation), siteId, protocolVersionId]
    );

    if (updateResult.rowCount === 0) {
        // Insert if doesn't exist
        await pool.query(
            `INSERT INTO site_protocol_versions (site_id, protocol_version_id, study_simulations, study_simulations_sync)
             VALUES ($1, $2, $3, true)
             ON CONFLICT (site_id, protocol_version_id) DO UPDATE SET
                 study_simulations = EXCLUDED.study_simulations,
                 study_simulations_sync = true`,
            [siteId, protocolVersionId, JSON.stringify(simulation)]
        );
    }

    return true;
}

/**
 * Get StudySimulation sync status for a study
 * Returns true if study_simulations_sync is true, false otherwise
 */
export async function getStudySimulationSyncStatus(studyId: string): Promise<boolean> {
    const pool = getDbPool();
    
    console.log(`[model-service] getStudySimulationSyncStatus: studyId=${studyId}`);
    
    const result = await pool.query(
        `SELECT spv.study_simulations_sync
         FROM site_protocol_versions spv
         JOIN site s ON spv.site_id = s.site_id
         JOIN protocol_version pv ON spv.protocol_version_id = pv.protocol_version_id
         JOIN protocol pr ON pv.protocol_id = pr.protocol_id
         JOIN study st ON pr.study_id = st.study_id
         WHERE st.study_id = $1
         LIMIT 1`,
        [studyId]
    );

    if (result.rows.length === 0) {
        console.log(`[model-service] getStudySimulationSyncStatus: NO DATA for studyId=${studyId}`);
        return false;
    }

    const syncStatus = result.rows[0].study_simulations_sync ?? false;
    console.log(`[model-service] getStudySimulationSyncStatus: studyId=${studyId}, sync=${syncStatus}`);
    return syncStatus;
}

/**
 * Save model unit (StudyConfiguration, Availability, or PatientInfo) by study ID and unit name
 */
export async function saveModelUnit(studyId: string, unit: string, data: any): Promise<boolean> {
    const pool = getDbPool();
    
    switch (unit.toLowerCase()) {
        case 'studyconfiguration':
            return await saveStudyConfiguration(studyId, data);
        case 'availability':
            return await saveAvailability(studyId, data);
        case 'patientinfo':
            return await savePatientInfo(studyId, data);
        default:
            throw new Error(`Unknown model unit: ${unit}`);
    }
}

