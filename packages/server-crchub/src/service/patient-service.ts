import { getDbPool } from './db-connection.js';

export interface Patient {
    id: string;
    patientNumber?: string;
    initials?: string;
    dob?: string;
    age?: string;
    gender?: string;
    studyId: string;
    study?: string;
    attributes?: any;
}

/**
 * Get all patients for a user's facility
 */
export async function getPatients(oid: string): Promise<Patient[]> {
    const pool = getDbPool();
    
    // Get user's facility org_id
    const orgResult = await pool.query(
        `SELECT DISTINCT o.org_id 
         FROM person p
         JOIN site_persons sp ON p.person_id = sp.person_id
         JOIN site s ON sp.site_id = s.site_id
         JOIN organization o ON s.org_id = o.org_id
         WHERE p.oid = $1
         LIMIT 1`,
        [oid]
    );

    if (orgResult.rows.length === 0) {
        return [];
    }

    const orgId = orgResult.rows[0].org_id;

    // Get patients for sites in this organization
    // Use patient_protocol as primary link, fallback to site relationship
    const result = await pool.query(
        `SELECT DISTINCT
            p.patient_id as id,
            p.patient_number as "patientNumber",
            p.initials,
            p.dob,
            p.age,
            p.gender,
            p.patient_attributes as attributes,
            s.site_id,
            COALESCE(pp_st.study_id, s.study_id) as "studyId",
            COALESCE(pp_st.name, s_st.name) as study,
            p.created_at
         FROM patient p
         JOIN site s ON p.site_id = s.site_id
         LEFT JOIN patient_protocol pp ON p.patient_id = pp.patient_id
         LEFT JOIN protocol_version pp_pv ON pp.protocol_version_id = pp_pv.protocol_version_id
         LEFT JOIN protocol pp_pr ON pp_pv.protocol_id = pp_pr.protocol_id
         LEFT JOIN study pp_st ON pp_pr.study_id = pp_st.study_id
         LEFT JOIN study s_st ON s.study_id = s_st.study_id
         WHERE s.org_id = $1
         ORDER BY p.created_at DESC`,
        [orgId]
    );

    return result.rows.map(row => {
        const attributes = row.attributes || {};
        // Don't spread id if it exists in attributes
        const { id: _attrId, ...cleanAttributes } = attributes;
        return {
            id: row.id,
            patientNumber: row.patientNumber,
            initials: row.initials,
            dob: row.dob,
            age: row.age,
            gender: row.gender,
            studyId: row.studyId,
            study: row.study,
            ...cleanAttributes
        };
    });
}

/**
 * Get patients for a specific study
 */
export async function getStudyPatients(oid: string, studyId: string): Promise<Patient[]> {
    const pool = getDbPool();
    
    console.log(`[getStudyPatients] oid=${oid}, studyId=${studyId}`);
    
    // Simple direct path: study -> site -> patient
    const result = await pool.query(
        `SELECT DISTINCT
            p.patient_id as id,
            p.patient_number as "patientNumber",
            p.initials,
            p.dob,
            p.age,
            p.gender,
            p.patient_attributes as attributes,
            st.study_id as "studyId",
            st.name as study,
            s.site_id,
            s.site_number,
            p.created_at
         FROM patient p
         JOIN site s ON p.site_id = s.site_id
         JOIN study st ON s.study_id = st.study_id
         WHERE st.study_id = $1
         ORDER BY p.created_at DESC`,
        [studyId]
    );
    
    console.log(`[getStudyPatients] Query returned ${result.rows.length} patients for study ${studyId}`);
    if (result.rows.length > 0) {
        console.log(`[getStudyPatients] First patient site: ${result.rows[0].site_id}, site_number: ${result.rows[0].site_number}`);
    }

    return result.rows.map(row => {
        const attributes = row.attributes || {};
        // Don't spread id if it exists in attributes
        const { id: _attrId, ...cleanAttributes } = attributes;
        return {
            id: row.id,
            patientNumber: row.patientNumber,
            initials: row.initials,
            dob: row.dob,
            age: row.age,
            gender: row.gender,
            studyId: row.studyId,
            study: row.study,
            ...cleanAttributes
        };
    });
}

/**
 * Get a single patient by ID
 */
export async function getPatient(oid: string, patientId: string): Promise<Patient | null> {
    const pool = getDbPool();
    
    // Use patient_protocol as primary link, fallback to site relationship
    const result = await pool.query(
        `SELECT DISTINCT
            p.patient_id as id,
            p.patient_number as "patientNumber",
            p.initials,
            p.dob,
            p.age,
            p.gender,
            p.patient_attributes as attributes,
            COALESCE(pp_st.study_id, s_st.study_id) as "studyId",
            COALESCE(pp_st.name, s_st.name) as study
         FROM patient p
         JOIN site s ON p.site_id = s.site_id
         LEFT JOIN patient_protocol pp ON p.patient_id = pp.patient_id
         LEFT JOIN protocol_version pp_pv ON pp.protocol_version_id = pp_pv.protocol_version_id
         LEFT JOIN protocol pp_pr ON pp_pv.protocol_id = pp_pr.protocol_id
         LEFT JOIN study pp_st ON pp_pr.study_id = pp_st.study_id
         LEFT JOIN study s_st ON s.study_id = s_st.study_id
         WHERE p.patient_id = $1`,
        [patientId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    const attributes = row.attributes || {};
    // Don't spread id if it exists in attributes
    const { id: _attrId, ...cleanAttributes } = attributes;
    return {
        id: row.id,
        patientNumber: row.patientNumber,
        initials: row.initials,
        dob: row.dob,
        age: row.age,
        gender: row.gender,
        studyId: row.studyId,
        study: row.study,
        ...cleanAttributes
    };
}

/**
 * Create a new patient
 */
export async function createPatient(oid: string, patientData: Omit<Patient, 'id'>): Promise<Patient> {
    const pool = getDbPool();
    
    // Get or create site for the study
    const studyResult = await pool.query(
        `SELECT s.site_id, s.org_id, pv.protocol_version_id
         FROM study st
         LEFT JOIN site s ON st.study_id = s.study_id
         LEFT JOIN protocol pr ON st.study_id = pr.study_id
         LEFT JOIN protocol_version pv ON pr.protocol_id = pv.protocol_id
         WHERE st.study_id = $1
         LIMIT 1`,
        [patientData.studyId]
    );

    if (studyResult.rows.length === 0) {
        throw new Error(`Study not found: ${patientData.studyId}`);
    }

    let siteId = studyResult.rows[0].site_id;
    const orgId = studyResult.rows[0].org_id;
    const protocolVersionId = studyResult.rows[0].protocol_version_id;

    // If no site exists, create one
    if (!siteId) {
        // Get user's org_id to create site
        const userOrgResult = await pool.query(
            `SELECT DISTINCT o.org_id 
             FROM person p
             JOIN site_persons sp ON p.person_id = sp.person_id
             JOIN site s ON sp.site_id = s.site_id
             JOIN organization o ON s.org_id = o.org_id
             WHERE p.oid = $1
             LIMIT 1`,
            [oid]
        );

        const userOrgId = userOrgResult.rows[0]?.org_id || orgId;

        const siteResult = await pool.query(
            `INSERT INTO site (org_id, study_id, site_number)
             VALUES ($1, $2, $3)
             RETURNING site_id`,
            [userOrgId, patientData.studyId, `site-${Date.now()}`]
        );
        siteId = siteResult.rows[0].site_id;
    }

    // Extract known fields, rest goes to attributes (id should not be in patientData per type)
    const { studyId, study, ...patientFields } = patientData;
    const { patientNumber, initials, dob, age, gender, ...inputAttributes } = patientFields;
    
    // Remove id from attributes if it somehow got in there
    const { id: _inputAttrId, ...cleanInputAttributes } = inputAttributes as any;

    const result = await pool.query(
        `INSERT INTO patient (site_id, patient_number, initials, dob, age, gender, patient_attributes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING patient_id as id, patient_number as "patientNumber", initials, dob, age, gender, patient_attributes as attributes`,
        [siteId, patientNumber || null, initials || null, dob || null, age || null, gender || null, JSON.stringify(cleanInputAttributes || {})]
    );

    const row = result.rows[0];
    
    // Create patient_protocol link to protocol version if it exists
    if (protocolVersionId) {
        await pool.query(
            `INSERT INTO patient_protocol (patient_id, protocol_version_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [row.id, protocolVersionId]
        );
    }
    
    // Get study name for response
    const studyNameResult = await pool.query(
        `SELECT name FROM study WHERE study_id = $1`,
        [studyId]
    );

    const attributes = row.attributes || {};
    // Don't spread id if it exists in attributes
    const { id: _outputAttrId, ...cleanAttributes } = attributes;
    return {
        id: row.id,
        patientNumber: row.patientNumber,
        initials: row.initials,
        dob: row.dob,
        age: row.age,
        gender: row.gender,
        studyId: studyId,
        study: studyNameResult.rows[0]?.name,
        ...cleanAttributes
    };
}

/**
 * Update an existing patient
 */
export async function updatePatient(oid: string, patientId: string, patientData: Partial<Patient>): Promise<Patient | null> {
    const pool = getDbPool();
    
    // Extract known fields, filter out id from going to attributes
    const { studyId, study, id: _inputId, ...patientFields } = patientData;
    const { patientNumber, initials, dob, age, gender, ...inputAttributes } = patientFields;
    
    // Remove id from attributes if it's in there
    const { id: _inputAttrId, ...cleanInputAttributes } = inputAttributes as any;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (patientNumber !== undefined) {
        updates.push(`patient_number = $${paramIndex++}`);
        values.push(patientNumber);
    }
    if (initials !== undefined) {
        updates.push(`initials = $${paramIndex++}`);
        values.push(initials);
    }
    if (dob !== undefined) {
        updates.push(`dob = $${paramIndex++}`);
        values.push(dob);
    }
    if (age !== undefined) {
        updates.push(`age = $${paramIndex++}`);
        values.push(age);
    }
    if (gender !== undefined) {
        updates.push(`gender = $${paramIndex++}`);
        values.push(gender);
    }
    if (Object.keys(cleanInputAttributes).length > 0) {
        // Merge with existing attributes
        const existingResult = await pool.query(
            `SELECT patient_attributes FROM patient WHERE patient_id = $1`,
            [patientId]
        );
        const existingAttributes = existingResult.rows[0]?.patient_attributes || {};
        // Also remove id from existing attributes when merging
        const { id: _existingId, ...cleanExistingAttributes } = existingAttributes;
        updates.push(`patient_attributes = $${paramIndex++}`);
        values.push(JSON.stringify({ ...cleanExistingAttributes, ...cleanInputAttributes }));
    }

    if (updates.length === 0) {
        return await getPatient(oid, patientId);
    }

    values.push(patientId);
    const result = await pool.query(
        `UPDATE patient 
         SET ${updates.join(', ')}
         WHERE patient_id = $${paramIndex}
         RETURNING patient_id as id, patient_number as "patientNumber", initials, dob, age, gender, patient_attributes as attributes`,
        values
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    
    // Get study info - use patient_protocol as primary, fallback to site
    const studyResult = await pool.query(
        `SELECT DISTINCT
            COALESCE(pp_st.study_id, s_st.study_id) as study_id,
            COALESCE(pp_st.name, s_st.name) as name
         FROM patient p
         JOIN site s ON p.site_id = s.site_id
         LEFT JOIN patient_protocol pp ON p.patient_id = pp.patient_id
         LEFT JOIN protocol_version pp_pv ON pp.protocol_version_id = pp_pv.protocol_version_id
         LEFT JOIN protocol pp_pr ON pp_pv.protocol_id = pp_pr.protocol_id
         LEFT JOIN study pp_st ON pp_pr.study_id = pp_st.study_id
         LEFT JOIN study s_st ON s.study_id = s_st.study_id
         WHERE p.patient_id = $1`,
        [patientId]
    );

    const studyInfo = studyResult.rows[0];

    const attributes = row.attributes || {};
    // Don't spread id if it exists in attributes
    const { id: _outputAttrId, ...cleanAttributes } = attributes;
    return {
        id: row.id,
        patientNumber: row.patientNumber,
        initials: row.initials,
        dob: row.dob,
        age: row.age,
        gender: row.gender,
        studyId: studyInfo?.study_id,
        study: studyInfo?.name,
        ...cleanAttributes
    };
}

/**
 * Delete a patient
 */
export async function deletePatient(oid: string, patientId: string): Promise<boolean> {
    const pool = getDbPool();
    
    // First check if patient exists
    const patientCheck = await pool.query(
        `SELECT patient_id FROM patient WHERE patient_id = $1`,
        [patientId]
    );

    if (patientCheck.rows.length === 0) {
        return false;
    }
    
    // Try to get user's facility org_id
    const orgResult = await pool.query(
        `SELECT DISTINCT o.org_id 
         FROM person p
         JOIN site_persons sp ON p.person_id = sp.person_id
         JOIN site s ON sp.site_id = s.site_id
         JOIN organization o ON s.org_id = o.org_id
         WHERE p.oid = $1
         LIMIT 1`,
        [oid]
    );

    // If user has organization association, verify patient belongs to that org
    if (orgResult.rows.length > 0) {
        const orgId = orgResult.rows[0].org_id;
        const result = await pool.query(
            `DELETE FROM patient 
             WHERE patient_id = $1 
             AND site_id IN (
                 SELECT site_id FROM site WHERE org_id = $2
             )`,
            [patientId, orgId]
        );
        return result.rowCount !== null && result.rowCount > 0;
    }
    
    // If user has no organization association, allow delete (for now)
    // TODO: In production, you may want to restrict this further
    const result = await pool.query(
        `DELETE FROM patient WHERE patient_id = $1`,
        [patientId]
    );

    return result.rowCount !== null && result.rowCount > 0;
}

