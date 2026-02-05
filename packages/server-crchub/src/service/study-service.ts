import { consoleLogInfo } from '../server/logging.js';
import { getDbPool } from './db-connection.js';
import * as modelService from './model-service.js';
import * as siteService from './site-service.js';
import { cloneJson, ensureUniqueCopyLabel, validateName } from './copy-study-utils.js';

export interface Study {
    id: string;
    name: string;
    title?: string;
    phase?: string;
    status?: string;
    therapeutic_area?: string;
    identifiers?: Array<{ type: string; identifier: string }>;
    interventions?: Array<{ type: string; name: string }>;
    currentProtocol?: string;
    protocolAmendments?: Array<{
        version: string;
        date: string;
        description: string;
    }>;
    attributes?: any;
}

async function getUserOrgId(oid: string): Promise<string> {
    const pool = getDbPool();
    const orgResult = await pool.query(
        `SELECT op.org_id
         FROM person p
         JOIN org_persons op ON p.person_id = op.person_id
         WHERE p.oid = $1
         LIMIT 1`,
        [oid]
    );
    const orgId = orgResult.rows[0]?.org_id;
    if (!orgId) {
        throw new Error('User has no associated organization.');
    }
    return orgId;
}

/**
 * Get all studies for a user's facility
 * @param oid - User's Azure OID
 * @param all - If true, get all studies across all organizations (admin mode)
 */
export async function getStudies(oid: string, all: boolean = false): Promise<Study[]> {
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

    const userOrgId = orgResult.rows[0]?.org_id;
    
    // Get studies with site information
    // Site = intersection of facility (organization) and study (1 facility + 1 study = 1 site)
    // site_number = the name/identifier of that facility on that specific study
    
    console.log(`[getStudies] oid=${oid}, all=${all}, userOrgId=${userOrgId}`);
    
    let query: string;
    let params: any[];
    
    if (all) {
        // Admin mode: Get ALL studies across all facilities
        // Show user's site_number if they participate, and show all participating facilities
        query = `SELECT 
            s.study_id as id,
            s.name,
            s.title,
            s.phase,
            s.status,
            s.therapeutic_area,
            s.attributes,
            (
                SELECT COUNT(DISTINCT p.patient_id)
                FROM patient p
                WHERE EXISTS (
                    SELECT 1 FROM patient_protocol pp
                    JOIN protocol_version pv ON pp.protocol_version_id = pv.protocol_version_id
                    JOIN protocol pr ON pv.protocol_id = pr.protocol_id
                    WHERE pp.patient_id = p.patient_id AND pr.study_id = s.study_id
                ) OR EXISTS (
                    SELECT 1 FROM site st
                    WHERE st.site_id = p.site_id AND st.study_id = s.study_id
                )
            )::integer as patient_count,
            user_site.site_number,
            (
                SELECT STRING_AGG(o.name, ', ' ORDER BY o.name)
                FROM site st
                JOIN organization o ON st.org_id = o.org_id
                WHERE st.study_id = s.study_id
            ) as organization_name
         FROM study s
         LEFT JOIN site user_site ON user_site.study_id = s.study_id AND user_site.org_id = $1
         ORDER BY s.created_at DESC`;
        params = [userOrgId];
    } else {
        // Regular mode: Only studies where user's facility has a site
        query = `SELECT 
            s.study_id as id,
            s.name,
            s.title,
            s.phase,
            s.status,
            s.therapeutic_area,
            s.attributes,
            (
                SELECT COUNT(DISTINCT p.patient_id)
                FROM patient p
                WHERE EXISTS (
                    SELECT 1 FROM patient_protocol pp
                    JOIN protocol_version pv ON pp.protocol_version_id = pv.protocol_version_id
                    JOIN protocol pr ON pv.protocol_id = pr.protocol_id
                    WHERE pp.patient_id = p.patient_id AND pr.study_id = s.study_id
                ) OR EXISTS (
                    SELECT 1 FROM site st
                    WHERE st.site_id = p.site_id AND st.study_id = s.study_id
                )
            )::integer as patient_count,
            user_site.site_number,
            user_org.name as organization_name
         FROM study s
         INNER JOIN site user_site ON user_site.study_id = s.study_id AND user_site.org_id = $1
         INNER JOIN organization user_org ON user_site.org_id = user_org.org_id
         ORDER BY s.created_at DESC`;
        params = [userOrgId];
    }
    
    const result = await pool.query(query, params);
    
    console.log(`[getStudies] Query returned ${result.rows.length} rows`);
    
    // Log patient counts for debugging
    result.rows.forEach(row => {
        if (row.patient_count > 0) {
            console.log(`[getStudies] Study ${row.name} (${row.id}): ${row.patient_count} patients`);
        }
    });

    const mappedResults = result.rows.map(row => {
        // Ensure patient_count is properly converted to a number
        // PostgreSQL COUNT returns bigint, which might be a string or number
        let patientCount = 0;
        const rawCount = row.patient_count;
        if (rawCount !== null && rawCount !== undefined && rawCount !== '') {
            if (typeof rawCount === 'string') {
                const parsed = parseInt(rawCount, 10);
                patientCount = isNaN(parsed) ? 0 : parsed;
            } else if (typeof rawCount === 'number') {
                patientCount = isNaN(rawCount) ? 0 : Math.floor(rawCount);
            } else {
                // Try to convert to number
                const converted = Number(rawCount);
                patientCount = isNaN(converted) ? 0 : Math.floor(converted);
            }
        }
        
        // Extract attributes and remove fields that should not be overwritten
        // PostgreSQL JSONB might return as object or string, so ensure it's parsed
        let attributes: any = {};
        if (row.attributes) {
            if (typeof row.attributes === 'string') {
                try {
                    attributes = JSON.parse(row.attributes);
                } catch (e) {
                    console.error('Failed to parse attributes JSON:', e);
                    attributes = {};
                }
            } else {
                attributes = row.attributes;
            }
        }
        
        // CRITICAL: Remove id from attributes to prevent overwriting the database study_id
        // Also remove patient_count and patientCount
        const { id: removedId, patient_count: removedPatientCount, patientCount: removedPatientCount2, ...cleanAttributes } = attributes;
        
        // Log if we found an id in attributes that differs from row.id (for debugging)
        if (removedId && removedId !== String(row.id)) {
            consoleLogInfo('[study-service]', `Warning: Found id in attributes (${removedId}) that differs from database study_id (${row.id}). Using database study_id.`);
        }
        
        // Ensure row.id is a string (UUIDs from PostgreSQL might be objects)
        const studyId = String(row.id);
        
        // Build the study object - spread cleanAttributes first, then set our critical fields
        const study: any = {
            ...cleanAttributes,  // Spread attributes WITHOUT id
            name: row.name,
            title: row.title,
            phase: row.phase,
            status: row.status,
            therapeutic_area: row.therapeutic_area,
            patient_count: patientCount,
            site_number: row.site_number || null,
            organization_name: row.organization_name || null
        };
        
        // CRITICAL: Set id ABSOLUTELY LAST to ensure it's never overwritten
        study.id = studyId;
        
        return study;
    });
    
    return mappedResults;
}

/**
 * Get a single study by ID
 */
export async function getStudy(oid: string, studyId: string): Promise<Study | null> {
    const pool = getDbPool();

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
    const userOrgId = orgResult.rows[0]?.org_id ?? null;

    const result = await pool.query(
        `SELECT 
            s.study_id as id,
            s.name,
            s.title,
            s.phase,
            s.status,
            s.therapeutic_area,
            s.attributes,
            user_site.site_number
         FROM study s
         LEFT JOIN site user_site ON user_site.study_id = s.study_id AND user_site.org_id = $2
         WHERE s.study_id = $1`,
        [studyId, userOrgId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    // Extract attributes and remove id to avoid overwriting the database study_id
    const dbAttributes = row.attributes || {};
    let parsedAttributes: any = {};
    if (typeof dbAttributes === 'string') {
        try {
            parsedAttributes = JSON.parse(dbAttributes);
        } catch (e) {
            parsedAttributes = {};
        }
    } else {
        parsedAttributes = dbAttributes;
    }
    const { id: removedId, patient_count: removedPatientCount, patientCount: removedPatientCount2, ...cleanDbAttributes } = parsedAttributes;
    
    // Ensure row.id is a string (UUIDs from PostgreSQL might be objects)
    const dbStudyId = String(row.id);
    
    // Build the study object, ensuring id is set last
    const study: any = {
        name: row.name,
        title: row.title,
        phase: row.phase,
        status: row.status,
        therapeutic_area: row.therapeutic_area,
        site_number: row.site_number || null,
        ...cleanDbAttributes
    };
    
    // CRITICAL: Set id LAST to ensure it's never overwritten by attributes
    study.id = dbStudyId;
    
    return study;
}

/**
 * Check whether a study name already exists (duplicate).
 * @param oid - User's Azure OID
 * @param studyName - The name to check
 * @param excludeStudyId - Optional study ID to exclude (e.g. when editing, exclude the current study)
 * @param all - If true, check against all studies (admin scope); otherwise user's studies only
 * @returns true if the name already exists, false if it is unique
 */
export async function checkStudyNameExists(
    oid: string,
    studyName: string,
    excludeStudyId?: string,
    all: boolean = false
): Promise<boolean> {
    const studies = await getStudies(oid, all);
    const existing = studies.map((s) => ({ id: s.id, name: s.name }));
    const isUnique = validateName(studyName, existing, excludeStudyId);
    return !isUnique;
}

/**
 * Create a new study
 */
export async function createStudy(oid: string, studyData: Omit<Study, 'id'>): Promise<Study> {
    const pool = getDbPool();
    
    // Extract known fields and everything else goes to attributes
    const { name, title, phase, status, therapeutic_area, ...rest } = studyData;
    
    // CRITICAL: Remove id from attributes if it exists (shouldn't be there, but be safe)
    // Also remove patient_count and patientCount as these are calculated fields
    // Use 'as any' because TypeScript doesn't know about these fields in rest
    const restAny = rest as any;
    const { id: removedIdFromRest, patient_count: removedPatientCountFromRest, patientCount: removedPatientCount2FromRest, ...cleanAttributes } = restAny;
    
    const result = await pool.query(
        `INSERT INTO study (name, title, phase, status, therapeutic_area, attributes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING study_id as id, name, title, phase, status, therapeutic_area, attributes`,
        [name, title || null, phase || null, status || null, therapeutic_area || null, JSON.stringify(cleanAttributes || {})]
    );

    const row = result.rows[0];
    
    // Create default protocol and protocol version
    const protocolResult = await pool.query(
        `INSERT INTO protocol (study_id, title, description)
         VALUES ($1, $2, $3)
         RETURNING protocol_id`,
        [row.id, title || name, null]
    );
    
    const protocolId = protocolResult.rows[0].protocol_id;
    
    await pool.query(
        `INSERT INTO protocol_version (protocol_id, protocol_number, version, effective_date)
         VALUES ($1, $2, $3, $4)`,
        [protocolId, 'v1', 'v1', new Date()]
    );

    // Extract attributes from database and remove id to avoid overwriting the database study_id
    const dbAttributes = row.attributes || {};
    let parsedAttributes: any = {};
    if (typeof dbAttributes === 'string') {
        try {
            parsedAttributes = JSON.parse(dbAttributes);
        } catch (e) {
            parsedAttributes = {};
        }
    } else {
        parsedAttributes = dbAttributes;
    }
    const { id: removedIdFromDb, patient_count: removedPatientCountFromDb, patientCount: removedPatientCount2FromDb, ...cleanDbAttributes } = parsedAttributes;
    
    // Ensure row.id is a string (UUIDs from PostgreSQL might be objects)
    const dbStudyId = String(row.id);
    
    // Build the study object, ensuring id is set last
    const study: any = {
        name: row.name,
        title: row.title,
        phase: row.phase,
        status: row.status,
        therapeutic_area: row.therapeutic_area,
        ...cleanDbAttributes
    };
    
    // CRITICAL: Set id LAST to ensure it's never overwritten by attributes
    study.id = dbStudyId;
    
    return study;
}

/**
 * Create a study with a site for the user's organization
 * 
 * This is the PRIMARY method for creating studies from the UI. It ensures:
 * 1. The study is created
 * 2. A site is automatically created linking the study to the user's organization (facility)
 * 3. The creator is automatically assigned to the site via site_persons
 * 4. The creator can then add other people to the study/site
 * 
 * IMPORTANT: The user MUST belong to an organization (via org_persons) before creating a study.
 * The workflow is: Person → Organization (facility) → Study → Site → Site_Persons
 * 
 * @param oid - The OID of the user creating the study
 * @param studyData - Study data including required siteNumber field
 * @returns The created study
 */
export async function createStudyWithSite(oid: string, studyData: Omit<Study, 'id'> & { siteNumber: string }): Promise<Study> {
    const pool = getDbPool();
    const moduleName = '[study-service]';
    
    console.log(`${moduleName} [createStudyWithSite] Starting - oid=${oid}, studyName=${studyData.name}, siteNumber=${studyData.siteNumber}`);
    
    // Extract siteNumber from studyData
    const { siteNumber, ...cleanStudyData } = studyData as any;
    
    // Validate siteNumber is provided
    if (!siteNumber || typeof siteNumber !== 'string' || siteNumber.trim() === '') {
        throw new Error('Site number is required');
    }
    
    // Begin transaction
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log(`${moduleName} [createStudyWithSite] Transaction started`);
        
        // 1. Get the user's person_id
        console.log(`${moduleName} [createStudyWithSite] Step 1: Getting user's person_id for oid=${oid}`);
        const personResult = await client.query(
            `SELECT person_id FROM person WHERE oid = $1`,
            [oid]
        );
        
        if (personResult.rows.length === 0) {
            throw new Error('User not found');
        }
        
        const personId = personResult.rows[0].person_id;
        console.log(`${moduleName} [createStudyWithSite] Found person_id=${personId}`);
        
        // 2. Get the user's organization (first one from org_persons)
        console.log(`${moduleName} [createStudyWithSite] Step 2: Getting user's organization from org_persons`);
        const orgResult = await client.query(
            `SELECT op.org_id, op.org_person_id
             FROM org_persons op
             WHERE op.person_id = $1
             LIMIT 1`,
            [personId]
        );
        
        if (orgResult.rows.length === 0) {
            throw new Error('User has no associated organization. Person must belong to an organization first.');
        }
        
        const orgId = orgResult.rows[0].org_id;
        const orgPersonId = orgResult.rows[0].org_person_id;
        console.log(`${moduleName} [createStudyWithSite] Found org_id=${orgId}, org_person_id=${orgPersonId}`);
        
        // 2b. Get the user's first active role for this organization (for site_persons reference)
        console.log(`${moduleName} [createStudyWithSite] Step 2b: Getting user's role for organization`);
        const roleResult = await client.query(
            `SELECT opr.org_person_role_id
             FROM org_person_roles opr
             WHERE opr.org_person_id = $1
             AND (opr.end_date IS NULL OR opr.end_date >= CURRENT_DATE)
             ORDER BY opr.start_date DESC
             LIMIT 1`,
            [orgPersonId]
        );
        
        const orgPersonRolesId = roleResult.rows[0]?.org_person_role_id || null;
        console.log(`${moduleName} [createStudyWithSite] Found org_person_role_id=${orgPersonRolesId || 'null (no active role)'}`);
        
        // 3. Create the study
        console.log(`${moduleName} [createStudyWithSite] Step 3: Creating study: ${cleanStudyData.name}`);
        const { name, title, phase, status, therapeutic_area, ...rest } = cleanStudyData;
        const restAny = rest as any;
        const { id: removedId, patient_count: removedPatientCount, patientCount: removedPatientCount2, ...cleanAttributes } = restAny;
        
        const studyResult = await client.query(
            `INSERT INTO study (name, title, phase, status, therapeutic_area, attributes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING study_id as id, name, title, phase, status, therapeutic_area, attributes`,
            [name, title || null, phase || null, status || null, therapeutic_area || null, JSON.stringify(cleanAttributes || {})]
        );
        
        const studyRow = studyResult.rows[0];
        const studyId = String(studyRow.id);
        console.log(`${moduleName} [createStudyWithSite] Study created with study_id=${studyId}`);
        
        // 4. Create default protocol and protocol version
        console.log(`${moduleName} [createStudyWithSite] Step 4: Creating default protocol and protocol version`);
        const protocolResult = await client.query(
            `INSERT INTO protocol (study_id, title, description)
             VALUES ($1, $2, $3)
             RETURNING protocol_id`,
            [studyId, title || name, null]
        );
        
        const protocolId = protocolResult.rows[0].protocol_id;
        
        await client.query(
            `INSERT INTO protocol_version (protocol_id, protocol_number, version, effective_date)
             VALUES ($1, $2, $3, $4)`,
            [protocolId, 'v1', 'v1', new Date()]
        );
        console.log(`${moduleName} [createStudyWithSite] Protocol created with protocol_id=${protocolId}`);
        
        // 5. Create the site (linking study to organization)
        console.log(`${moduleName} [createStudyWithSite] Step 5: Creating site - org_id=${orgId}, study_id=${studyId}, site_number=${siteNumber.trim()}`);
        const siteResult = await client.query(
            `INSERT INTO site (org_id, study_id, site_number)
             VALUES ($1, $2, $3)
             RETURNING site_id`,
            [orgId, studyId, siteNumber.trim()]
        );
        
        const siteId = siteResult.rows[0].site_id;
        console.log(`${moduleName} [createStudyWithSite] Site created with site_id=${siteId}`);
        
        // 6. Add the user to site_persons (assigning creator to the study/site)
        console.log(`${moduleName} [createStudyWithSite] Step 6: Adding user to site_persons - site_id=${siteId}, person_id=${personId}, org_person_role_id=${orgPersonRolesId || 'null'}`);
        
        // Try to insert with org_person_role_id if available, otherwise just person_id
        if (orgPersonRolesId) {
            try {
                await client.query(
                    `INSERT INTO site_persons (site_id, person_id, org_person_role_id)
                     VALUES ($1, $2, $3)
                     ON CONFLICT DO NOTHING`,
                    [siteId, personId, orgPersonRolesId]
                );
                console.log(`${moduleName} [createStudyWithSite] User added to site_persons with role reference`);
            } catch (roleError: any) {
                // If org_person_roles_id column doesn't exist or there's a constraint issue, fall back to just person_id
                console.log(`${moduleName} [createStudyWithSite] Could not add with role reference, trying without: ${roleError.message}`);
                await client.query(
                    `INSERT INTO site_persons (site_id, person_id)
                     VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [siteId, personId]
                );
                console.log(`${moduleName} [createStudyWithSite] User added to site_persons without role reference`);
            }
        } else {
            await client.query(
                `INSERT INTO site_persons (site_id, person_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [siteId, personId]
            );
            console.log(`${moduleName} [createStudyWithSite] User added to site_persons (no role available)`);
        }
        
        // Commit transaction
        console.log(`${moduleName} [createStudyWithSite] Committing transaction`);
        await client.query('COMMIT');
        console.log(`${moduleName} [createStudyWithSite] Transaction committed successfully`);
        
        // Build and return the study object
        const dbAttributes = studyRow.attributes || {};
        let parsedAttributes: any = {};
        if (typeof dbAttributes === 'string') {
            try {
                parsedAttributes = JSON.parse(dbAttributes);
            } catch (e) {
                parsedAttributes = {};
            }
        } else {
            parsedAttributes = dbAttributes;
        }
        const { id: removedIdFromDb, patient_count: removedPatientCountFromDb, patientCount: removedPatientCount2FromDb, ...cleanDbAttributes } = parsedAttributes;
        
        const study: any = {
            name: studyRow.name,
            title: studyRow.title,
            phase: studyRow.phase,
            status: studyRow.status,
            therapeutic_area: studyRow.therapeutic_area,
            ...cleanDbAttributes
        };
        
        study.id = studyId;
        
        console.log(`${moduleName} [createStudyWithSite] Successfully created study ${studyId} with site ${siteId} and assigned user ${personId} to site`);
        return study;
    } catch (error) {
        console.error(`${moduleName} [createStudyWithSite] Error occurred, rolling back transaction:`, error);
        await client.query('ROLLBACK');
        if (error instanceof Error) {
            console.error(`${moduleName} [createStudyWithSite] Error stack:`, error.stack);
        }
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Update an existing study
 */
export async function updateStudy(oid: string, studyId: string, studyData: Partial<Study>): Promise<Study | null> {
    const pool = getDbPool();
    
    // Extract known fields and everything else goes to attributes
    const { name, title, phase, status, therapeutic_area, ...rest } = studyData;
    
    // CRITICAL: Remove id from attributes if it exists (shouldn't be there, but be safe)
    // Also remove patient_count and patientCount as these are calculated fields
    // Use 'as any' because TypeScript doesn't know about these fields in rest
    const restAny = rest as any;
    const { id: removedId, patient_count: removedPatientCount, patientCount: removedPatientCount2, ...attributes } = restAny;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
    }
    if (title !== undefined) {
        updates.push(`title = $${paramIndex++}`);
        values.push(title);
    }
    if (phase !== undefined) {
        updates.push(`phase = $${paramIndex++}`);
        values.push(phase);
    }
    if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
    }
    if (therapeutic_area !== undefined) {
        updates.push(`therapeutic_area = $${paramIndex++}`);
        values.push(therapeutic_area);
    }
    if (Object.keys(attributes).length > 0) {
        // Merge with existing attributes
        const existingResult = await pool.query(
            `SELECT attributes FROM study WHERE study_id = $1`,
            [studyId]
        );
        const existingAttributes = existingResult.rows[0]?.attributes || {};
        updates.push(`attributes = $${paramIndex++}`);
        values.push(JSON.stringify({ ...existingAttributes, ...attributes }));
    }

    if (updates.length === 0) {
        return await getStudy(oid, studyId);
    }

    values.push(studyId);
    const result = await pool.query(
        `UPDATE study 
         SET ${updates.join(', ')}
         WHERE study_id = $${paramIndex}
         RETURNING study_id as id, name, title, phase, status, therapeutic_area, attributes`,
        values
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    // Extract attributes from database and remove id to avoid overwriting the database study_id
    const dbAttributes = row.attributes || {};
    let parsedAttributes: any = {};
    if (typeof dbAttributes === 'string') {
        try {
            parsedAttributes = JSON.parse(dbAttributes);
        } catch (e) {
            parsedAttributes = {};
        }
    } else {
        parsedAttributes = dbAttributes;
    }
    const { id: removedIdFromDb, patient_count: removedPatientCountFromDb, patientCount: removedPatientCount2FromDb, ...cleanDbAttributes } = parsedAttributes;
    
    // Ensure row.id is a string (UUIDs from PostgreSQL might be objects)
    const dbStudyId = String(row.id);
    
    // Build the study object, ensuring id is set last
    const study: any = {
        name: row.name,
        title: row.title,
        phase: row.phase,
        status: row.status,
        therapeutic_area: row.therapeutic_area,
        ...cleanDbAttributes
    };
    
    // CRITICAL: Set id LAST to ensure it's never overwritten by attributes
    study.id = dbStudyId;
    
    return study;
}

/**
 * Delete a study
 */
export async function deleteStudy(oid: string, studyId: string): Promise<boolean> {
    const pool = getDbPool();
    
    try {
        // First, check if the study exists
        const checkResult = await pool.query(
            `SELECT study_id FROM study WHERE study_id = $1`,
            [studyId]
        );

        if (checkResult.rows.length === 0) {
            return false;
        }

        // Check if there are any patients linked to this study
        // Patients can be linked via patient_protocol or via site
        const patientCheck = await pool.query(
            `SELECT COUNT(DISTINCT p.patient_id) as patient_count
             FROM patient p
             WHERE EXISTS (
                 SELECT 1
                 FROM patient_protocol pp
                 JOIN protocol_version pv ON pp.protocol_version_id = pv.protocol_version_id
                 JOIN protocol pr ON pv.protocol_id = pr.protocol_id
                 WHERE pp.patient_id = p.patient_id
                   AND pr.study_id = $1
             ) OR EXISTS (
                 SELECT 1
                 FROM site st
                 WHERE st.site_id = p.site_id
                   AND st.study_id = $1
             )`,
            [studyId]
        );

        const patientCount = parseInt(patientCheck.rows[0]?.patient_count || '0', 10);
        if (patientCount > 0) {
            throw new Error(`Cannot delete study: it has ${patientCount} patient(s) associated with it. Please remove all patients before deleting the study.`);
        }

        // Check if there are any patient_protocols that would prevent deletion
        const constraintCheck = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM patient_protocol pp
                 JOIN protocol_version pv ON pp.protocol_version_id = pv.protocol_version_id
                 JOIN protocol pr ON pv.protocol_id = pr.protocol_id
                 WHERE pr.study_id = $1) as patient_protocol_count`,
            [studyId]
        );

        const patientProtocolCount = parseInt(constraintCheck.rows[0]?.patient_protocol_count || '0', 10);

        if (patientProtocolCount > 0) {
            throw new Error(`Cannot delete study: it has ${patientProtocolCount} patient protocol link(s) that prevent deletion.`);
        }

        // Delete the study
        // CASCADE DELETE handles:
        // - sites (via site.study_id FK)
        // - site_persons (via site_persons.site_id FK)  
        // - protocol, protocol_version, site_protocol_versions (via existing CASCADE constraints)
        const result = await pool.query(
            `DELETE FROM study WHERE study_id = $1`,
            [studyId]
        );

        return result.rowCount !== null && result.rowCount > 0;
    } catch (error: any) {
        // If it's already our custom error, re-throw it
        if (error.message?.includes('Cannot delete study')) {
            throw error;
        }
        // Check if it's a foreign key constraint violation
        if (error.code === '23503' || error.message?.includes('violates foreign key constraint')) {
            throw new Error('Cannot delete study: it has related records that prevent deletion');
        }
        // Re-throw other errors
        throw error;
    }
}

/**
 * Copy a study and its StudyConfiguration (but exclude patient data)
 */
export async function copyStudy(
    oid: string,
    sourceStudyId: string,
    overrides: Partial<Study> & { siteNumber?: string },
): Promise<Study> {
    const pool = getDbPool();
    const sourceStudy = await getStudy(oid, sourceStudyId);
    if (!sourceStudy) {
        throw new Error(`Source study not found: ${sourceStudyId}`);
    }

    const orgId = await getUserOrgId(oid);
    const existingResult = await pool.query(
        `SELECT s.name, st.site_number
         FROM study s
         JOIN site st ON st.study_id = s.study_id
         WHERE st.org_id = $1`,
        [orgId]
    );
    const existingNames = existingResult.rows.map((row) => row.name).filter(Boolean);
    const existingSiteNumbers = existingResult.rows.map((row) => row.site_number).filter(Boolean);

    const sourceSite = await siteService.getUserStudySite(oid, sourceStudyId);
    const sourceSiteNumber = (sourceSite as any)?.site_number || (sourceSite as any)?.siteNumber || "";

    const desiredName = overrides.name?.trim() || sourceStudy.name;
    const desiredSiteNumber = overrides.siteNumber?.trim() || sourceSiteNumber;

    const uniqueName = ensureUniqueCopyLabel(desiredName, existingNames);
    const uniqueSiteNumber = ensureUniqueCopyLabel(desiredSiteNumber, existingSiteNumbers);

    const copyData: Omit<Study, "id"> & { siteNumber: string } = {
        ...sourceStudy,
        ...overrides,
        name: uniqueName,
        siteNumber: uniqueSiteNumber,
    };

    const newStudy = await createStudyWithSite(oid, copyData);

    const configuration = await modelService.getStudyConfiguration(sourceStudyId);
    if (configuration) {
        await modelService.saveStudyConfiguration(newStudy.id, cloneJson(configuration));
    }

    return newStudy;
}

