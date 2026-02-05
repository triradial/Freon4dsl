import { getDbPool } from './db-connection.js';
import { isGlobalAdmin } from './auth-utils.js';

export interface Site {
    id: string;
    org_id: string;
    study_id: string;
    site_number: string;
    patient_availability_and_history?: any;
    site_attributes?: any;
    start_date?: string;
    end_date?: string;
    created_at?: string;
    updated_at?: string;
    // Joined fields
    org_name?: string;
    org_type_name?: string;
    study_name?: string;
}

/**
 * Get all sites accessible by the user
 * - Global admins: all sites
 * - Regular users: sites in their organizations
 */
export async function getSites(oid: string): Promise<Site[]> {
    const pool = getDbPool();
    
    try {
        let query: string;
        let params: any[];
        
        if (isGlobalAdmin(oid)) {
            // Global admins see all sites
            query = `
                SELECT 
                    s.site_id as id,
                    s.org_id,
                    s.study_id,
                    s.site_number,
                    s.patient_availability_and_history,
                    s.site_attributes,
                    s.start_date,
                    s.end_date,
                    s.created_at,
                    s.updated_at,
                    o.name as org_name,
                    ot.name as org_type_name,
                    st.name as study_name
                FROM site s
                LEFT JOIN organization o ON s.org_id = o.org_id
                LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
                LEFT JOIN study st ON s.study_id = st.study_id
                ORDER BY o.name, s.site_number
            `;
            params = [];
        } else {
            // Non-global admins see only sites in their organizations
            query = `
                SELECT DISTINCT
                    s.site_id as id,
                    s.org_id,
                    s.study_id,
                    s.site_number,
                    s.patient_availability_and_history,
                    s.site_attributes,
                    s.start_date,
                    s.end_date,
                    s.created_at,
                    s.updated_at,
                    o.name as org_name,
                    ot.name as org_type_name,
                    st.name as study_name
                FROM site s
                LEFT JOIN organization o ON s.org_id = o.org_id
                LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
                LEFT JOIN study st ON s.study_id = st.study_id
                INNER JOIN org_persons op ON o.org_id = op.org_id
                INNER JOIN person per ON op.person_id = per.person_id
                WHERE per.oid = $1
                ORDER BY o.name, s.site_number
            `;
            params = [oid];
        }
        
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('Error fetching sites:', error);
        throw error;
    }
}

/**
 * Get a single site by ID
 */
export async function getSite(oid: string, siteId: string): Promise<Site | null> {
    const pool = getDbPool();
    
    try {
        const result = await pool.query(
            `SELECT 
                s.site_id as id,
                s.org_id,
                s.study_id,
                s.site_number,
                s.patient_availability_and_history,
                s.site_attributes,
                s.start_date,
                s.end_date,
                s.created_at,
                s.updated_at,
                o.name as org_name,
                ot.name as org_type_name,
                st.name as study_name
            FROM site s
            LEFT JOIN organization o ON s.org_id = o.org_id
            LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
            LEFT JOIN study st ON s.study_id = st.study_id
            WHERE s.site_id = $1`,
            [siteId]
        );
        
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching site:', error);
        throw error;
    }
}

/**
 * Get the site for a study and the user's organization
 */
export async function getUserStudySite(oid: string, studyId: string): Promise<Site | null> {
    const pool = getDbPool();
    
    try {
        // Get the user's person_id
        const personResult = await pool.query(
            `SELECT person_id FROM person WHERE oid = $1`,
            [oid]
        );
        
        if (personResult.rows.length === 0) {
            return null;
        }
        
        const personId = personResult.rows[0].person_id;
        
        // Get the user's organization from org_persons
        const orgResult = await pool.query(
            `SELECT op.org_id 
             FROM org_persons op
             WHERE op.person_id = $1
             LIMIT 1`,
            [personId]
        );
        
        if (orgResult.rows.length === 0) {
            return null;
        }
        
        const orgId = orgResult.rows[0].org_id;
        
        // Get the site for this study and organization
        const siteResult = await pool.query(
            `SELECT 
                s.site_id as id,
                s.org_id,
                s.study_id,
                s.site_number,
                s.patient_availability_and_history,
                s.site_attributes,
                s.start_date,
                s.end_date,
                s.created_at,
                s.updated_at,
                o.name as org_name,
                o.start_date as org_start_date,
                o.end_date as org_end_date,
                ot.name as org_type_name,
                st.name as study_name
            FROM site s
            LEFT JOIN organization o ON s.org_id = o.org_id
            LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
            LEFT JOIN study st ON s.study_id = st.study_id
            WHERE s.study_id = $1 AND s.org_id = $2`,
            [studyId, orgId]
        );
        
        return siteResult.rows[0] || null;
    } catch (error) {
        console.error('Error fetching user study site:', error);
        throw error;
    }
}

/**
 * Update site number for a specific site
 */
export async function updateSiteNumber(oid: string, siteId: string, siteNumber: string): Promise<Site> {
    const pool = getDbPool();
    
    try {
        const result = await pool.query(
            `UPDATE site SET
                site_number = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE site_id = $2
            RETURNING 
                site_id as id,
                org_id,
                study_id,
                site_number,
                patient_availability_and_history,
                site_attributes,
                start_date,
                end_date,
                created_at,
                updated_at`,
            [siteNumber, siteId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Site not found');
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error updating site number:', error);
        throw error;
    }
}

/**
 * Check if a site number already exists
 * @param oid - User's OID
 * @param siteNumber - The site number to check
 * @param excludeSiteId - Optional site ID to exclude (e.g. when editing, exclude the current site)
 * @param all - If true, check against all sites (admin scope); otherwise user's organization sites only
 * @returns true if the site number already exists, false if it is unique
 */
export async function checkSiteNumberExists(
    oid: string,
    siteNumber: string,
    excludeSiteId?: string,
    all: boolean = false
): Promise<boolean> {
    const pool = getDbPool();
    
    try {
        let query: string;
        let params: any[];
        
        if (all || isGlobalAdmin(oid)) {
            // Check against all sites (admin scope)
            query = `
                SELECT site_id 
                FROM site 
                WHERE LOWER(site_number) = LOWER($1)
                ${excludeSiteId ? 'AND site_id != $2' : ''}
                LIMIT 1
            `;
            params = excludeSiteId ? [siteNumber, excludeSiteId] : [siteNumber];
        } else {
            // Check against user's organization sites only
            query = `
                SELECT s.site_id 
                FROM site s
                INNER JOIN organization o ON s.org_id = o.org_id
                INNER JOIN org_persons op ON o.org_id = op.org_id
                INNER JOIN person per ON op.person_id = per.person_id
                WHERE per.oid = $1 
                AND LOWER(s.site_number) = LOWER($2)
                ${excludeSiteId ? 'AND s.site_id != $3' : ''}
                LIMIT 1
            `;
            params = excludeSiteId ? [oid, siteNumber, excludeSiteId] : [oid, siteNumber];
        }
        
        const result = await pool.query(query, params);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking site number exists:', error);
        throw error;
    }
}

/**
 * Get sites for a specific study
 */
export async function getStudySites(oid: string, studyId: string): Promise<Site[]> {
    const pool = getDbPool();
    
    try {
        let query: string;
        let params: any[];
        
        if (isGlobalAdmin(oid)) {
            query = `
                SELECT 
                    s.site_id as id,
                    s.org_id,
                    s.study_id,
                    s.site_number,
                    s.patient_availability_and_history,
                    s.site_attributes,
                    s.start_date,
                    s.end_date,
                    s.created_at,
                    s.updated_at,
                    o.name as org_name,
                    ot.name as org_type_name,
                    st.name as study_name,
                    COALESCE((
                        SELECT COUNT(*)
                        FROM patient p
                        WHERE p.site_id = s.site_id
                    ), 0)::integer as patient_count
                FROM site s
                LEFT JOIN organization o ON s.org_id = o.org_id
                LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
                LEFT JOIN study st ON s.study_id = st.study_id
                WHERE s.study_id = $1
                ORDER BY o.name, s.site_number
            `;
            params = [studyId];
        } else {
            query = `
                SELECT DISTINCT
                    s.site_id as id,
                    s.org_id,
                    s.study_id,
                    s.site_number,
                    s.patient_availability_and_history,
                    s.site_attributes,
                    s.start_date,
                    s.end_date,
                    s.created_at,
                    s.updated_at,
                    o.name as org_name,
                    ot.name as org_type_name,
                    st.name as study_name,
                    COALESCE((
                        SELECT COUNT(*)
                        FROM patient p
                        WHERE p.site_id = s.site_id
                    ), 0)::integer as patient_count
                FROM site s
                LEFT JOIN organization o ON s.org_id = o.org_id
                LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
                LEFT JOIN study st ON s.study_id = st.study_id
                INNER JOIN org_persons op ON o.org_id = op.org_id
                INNER JOIN person per ON op.person_id = per.person_id
                WHERE s.study_id = $1 AND per.oid = $2
                ORDER BY o.name, s.site_number
            `;
            params = [studyId, oid];
        }
        
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('Error fetching study sites:', error);
        throw error;
    }
}

/**
 * Get sites for a specific organization
 */
export async function getOrganizationSites(oid: string, orgId: string): Promise<Site[]> {
    const pool = getDbPool();
    
    try {
        const result = await pool.query(
            `SELECT 
                s.site_id as id,
                s.org_id,
                s.study_id,
                s.site_number,
                s.patient_availability_and_history,
                s.site_attributes,
                s.start_date,
                s.end_date,
                s.created_at,
                s.updated_at,
                o.name as org_name,
                ot.name as org_type_name,
                st.name as study_name,
                COALESCE((
                    SELECT COUNT(*)
                    FROM patient p
                    WHERE p.site_id = s.site_id
                ), 0)::integer as patient_count
            FROM site s
            LEFT JOIN organization o ON s.org_id = o.org_id
            LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
            LEFT JOIN study st ON s.study_id = st.study_id
            WHERE s.org_id = $1
            ORDER BY s.site_number`,
            [orgId]
        );
        
        return result.rows;
    } catch (error) {
        console.error('Error fetching organization sites:', error);
        throw error;
    }
}

/**
 * Create a new site
 */
export async function createSite(oid: string, siteData: Omit<Site, 'id'>): Promise<Site> {
    const pool = getDbPool();
    
    // Only global admins can create sites (for now)
    if (!isGlobalAdmin(oid)) {
        throw new Error('Only admins can create sites');
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO site (
                org_id, study_id, site_number,
                patient_availability_and_history, site_attributes,
                start_date, end_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING 
                site_id as id,
                org_id,
                study_id,
                site_number,
                patient_availability_and_history,
                site_attributes,
                start_date,
                end_date,
                created_at,
                updated_at`,
            [
                siteData.org_id,
                siteData.study_id,
                siteData.site_number,
                siteData.patient_availability_and_history ? JSON.stringify(siteData.patient_availability_and_history) : null,
                siteData.site_attributes ? JSON.stringify(siteData.site_attributes) : null,
                siteData.start_date || null,
                siteData.end_date || null
            ]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error creating site:', error);
        throw error;
    }
}

/**
 * Update an existing site
 */
export async function updateSite(oid: string, siteId: string, siteData: Partial<Site>): Promise<Site> {
    const pool = getDbPool();
    
    // Only global admins can update sites (for now)
    if (!isGlobalAdmin(oid)) {
        throw new Error('Only admins can update sites');
    }
    
    try {
        const result = await pool.query(
            `UPDATE site SET
                org_id = COALESCE($1, org_id),
                study_id = COALESCE($2, study_id),
                site_number = COALESCE($3, site_number),
                patient_availability_and_history = COALESCE($4, patient_availability_and_history),
                site_attributes = COALESCE($5, site_attributes),
                start_date = COALESCE($6, start_date),
                end_date = COALESCE($7, end_date),
                updated_at = CURRENT_TIMESTAMP
            WHERE site_id = $8
            RETURNING 
                site_id as id,
                org_id,
                study_id,
                site_number,
                patient_availability_and_history,
                site_attributes,
                start_date,
                end_date,
                created_at,
                updated_at`,
            [
                siteData.org_id,
                siteData.study_id,
                siteData.site_number,
                siteData.patient_availability_and_history ? JSON.stringify(siteData.patient_availability_and_history) : null,
                siteData.site_attributes ? JSON.stringify(siteData.site_attributes) : null,
                siteData.start_date,
                siteData.end_date,
                siteId
            ]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Site not found');
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error updating site:', error);
        throw error;
    }
}

/**
 * Delete a site
 */
export async function deleteSite(oid: string, siteId: string): Promise<boolean> {
    const pool = getDbPool();
    
    // Only global admins can delete sites
    if (!isGlobalAdmin(oid)) {
        throw new Error('Only global admins can delete sites');
    }
    
    try {
        const result = await pool.query(
            'DELETE FROM site WHERE site_id = $1 RETURNING site_id',
            [siteId]
        );
        
        return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
        console.error('Error deleting site:', error);
        throw error;
    }
}

