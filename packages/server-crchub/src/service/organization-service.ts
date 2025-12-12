import { getDbPool } from './db-connection.js';
import { isGlobalAdmin, getUserDomainOrgs, canAccessOrganization } from './auth-utils.js';

export interface Organization {
    id: string;
    org_type_id?: string;
    org_subtype_id?: string;
    name: string;
    is_domain?: boolean;
    staff_availability?: any;
    organization_attributes?: any;
    start_date?: string;
    end_date?: string;
    created_at?: string;
    updated_at?: string;
    // Joined fields
    org_type_name?: string;
    org_subtype_name?: string;
    person_count?: number;
}

/**
 * Get all organizations accessible by the user
 * - Global admins: all organizations
 * - Domain admins: organizations within their domain(s)
 * - Regular users: organizations they are associated with
 */
export async function getOrganizations(oid: string): Promise<Organization[]> {
    const pool = getDbPool();
    
    try {
        let query: string;
        let params: any[];
        
        const isAdmin = isGlobalAdmin(oid);
        console.log(`[getOrganizations] oid=${oid}, isGlobalAdmin=${isAdmin}`);
        
        if (isAdmin) {
            // Global admins see all organizations
            console.log('[getOrganizations] Using global admin query');
            query = `
                SELECT 
                    o.org_id as id,
                    o.org_type_id,
                    o.org_subtype_id,
                    o.name,
                    COALESCE(o.is_domain, false) as is_domain,
                    o.staff_availability,
                    o.organization_attributes,
                    o.start_date,
                    o.end_date,
                    o.created_at,
                    o.updated_at,
                    ot.name as org_type_name,
                    os.name as org_subtype_name,
                    COUNT(DISTINCT op.person_id) as person_count
                FROM organization o
                LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
                LEFT JOIN org_subtype os ON o.org_subtype_id = os.org_subtype_id
                LEFT JOIN org_persons op ON o.org_id = op.org_id
                GROUP BY o.org_id, o.org_type_id, o.org_subtype_id, o.name, o.is_domain, 
                         o.staff_availability, o.organization_attributes, o.start_date, 
                         o.end_date, o.created_at, o.updated_at, ot.name, os.name
                ORDER BY o.name
            `;
            params = [];
        } else {
            // Non-global admins see only their associated organizations
            console.log('[getOrganizations] Using regular user query');
            // For now, if organization_persons doesn't exist, show all (fallback)
            // This will be fixed once the migration is run
            try {
                // Check if org_persons table exists
                const tableCheck = await pool.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'org_persons'
                    )
                `);
                
                if (tableCheck.rows[0]?.exists) {
                    query = `
                        SELECT 
                            o.org_id as id,
                            o.org_type_id,
                            o.org_subtype_id,
                            o.name,
                            COALESCE(o.is_domain, false) as is_domain,
                            o.staff_availability,
                            o.organization_attributes,
                            o.start_date,
                            o.end_date,
                            o.created_at,
                            o.updated_at,
                            ot.name as org_type_name,
                            os.name as org_subtype_name,
                            COUNT(DISTINCT op2.person_id) as person_count
                        FROM organization o
                        LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
                        LEFT JOIN org_subtype os ON o.org_subtype_id = os.org_subtype_id
                        INNER JOIN org_persons op1 ON o.org_id = op1.org_id
                        INNER JOIN person p ON op1.person_id = p.person_id
                        LEFT JOIN org_persons op2 ON o.org_id = op2.org_id
                        WHERE p.oid = $1
                        GROUP BY o.org_id, o.org_type_id, o.org_subtype_id, o.name, o.is_domain, 
                                 o.staff_availability, o.organization_attributes, o.start_date, 
                                 o.end_date, o.created_at, o.updated_at, ot.name, os.name
                        ORDER BY o.name
                    `;
                    params = [oid];
                } else {
                    // Fallback: if table doesn't exist, show all (for migration period)
                    query = `
                        SELECT 
                            o.org_id as id,
                            o.org_type_id,
                            o.org_subtype_id,
                            o.name,
                            COALESCE(o.is_domain, false) as is_domain,
                            o.staff_availability,
                            o.organization_attributes,
                            o.start_date,
                            o.end_date,
                            o.created_at,
                            o.updated_at,
                            ot.name as org_type_name,
                            os.name as org_subtype_name,
                            COUNT(DISTINCT op.person_id) as person_count
                        FROM organization o
                        LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
                        LEFT JOIN org_subtype os ON o.org_subtype_id = os.org_subtype_id
                        LEFT JOIN org_persons op ON o.org_id = op.org_id
                        GROUP BY o.org_id, o.org_type_id, o.org_subtype_id, o.name, o.is_domain, 
                                 o.staff_availability, o.organization_attributes, o.start_date, 
                                 o.end_date, o.created_at, o.updated_at, ot.name, os.name
                        ORDER BY o.name
                    `;
                    params = [];
                }
            } catch (checkError) {
                // If check fails, use fallback query
                query = `
                    SELECT 
                        o.org_id as id,
                        o.org_type_id,
                        o.org_subtype_id,
                        o.name,
                        COALESCE(o.is_domain, false) as is_domain,
                        o.staff_availability,
                        o.organization_attributes,
                        o.start_date,
                        o.end_date,
                        o.created_at,
                        o.updated_at,
                        ot.name as org_type_name,
                        os.name as org_subtype_name,
                        COUNT(DISTINCT op.person_id) as person_count
                    FROM organization o
                    LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
                    LEFT JOIN org_subtype os ON o.org_subtype_id = os.org_subtype_id
                    LEFT JOIN org_persons op ON o.org_id = op.org_id
                    GROUP BY o.org_id, o.org_type_id, o.org_subtype_id, o.name, o.is_domain, 
                             o.staff_availability, o.organization_attributes, o.start_date, 
                             o.end_date, o.created_at, o.updated_at, ot.name, os.name
                    ORDER BY o.name
                `;
                params = [];
            }
        }
        
        const result = await pool.query(query, params);
        console.log(`[getOrganizations] Returned ${result.rows.length} organizations`);
        return result.rows;
    } catch (error) {
        console.error('Error fetching organizations:', error);
        throw error;
    }
}

/**
 * Get a single organization by ID
 */
export async function getOrganization(oid: string, orgId: string): Promise<Organization | null> {
    const pool = getDbPool();
    
    // Check access
    const hasAccess = await canAccessOrganization(oid, orgId);
    if (!hasAccess) {
        throw new Error('Access denied to this organization');
    }
    
    try {
        const result = await pool.query(
            `SELECT 
                o.org_id as id,
                o.org_type_id,
                o.org_subtype_id,
                o.name,
                o.is_domain,
                o.staff_availability,
                o.organization_attributes,
                o.start_date,
                o.end_date,
                o.created_at,
                o.updated_at,
                ot.name as org_type_name,
                os.name as org_subtype_name
            FROM organization o
            LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
            LEFT JOIN org_subtype os ON o.org_subtype_id = os.org_subtype_id
            WHERE o.org_id = $1`,
            [orgId]
        );
        
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching organization:', error);
        throw error;
    }
}

/**
 * Create a new organization
 */
export async function createOrganization(oid: string, orgData: Omit<Organization, 'id'>): Promise<Organization> {
    const pool = getDbPool();
    
    // Only global admins and domain admins can create organizations
    if (!isGlobalAdmin(oid)) {
        // TODO: Check if user is domain admin
        throw new Error('Only admins can create organizations');
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO organization (
                org_type_id, org_subtype_id, name, is_domain,
                staff_availability, organization_attributes, start_date, end_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING 
                org_id as id,
                org_type_id,
                org_subtype_id,
                name,
                is_domain,
                staff_availability,
                organization_attributes,
                start_date,
                end_date,
                created_at,
                updated_at`,
            [
                orgData.org_type_id || null,
                orgData.org_subtype_id || null,
                orgData.name,
                orgData.is_domain || false,
                orgData.staff_availability ? JSON.stringify(orgData.staff_availability) : null,
                orgData.organization_attributes ? JSON.stringify(orgData.organization_attributes) : null,
                orgData.start_date || null,
                orgData.end_date || null
            ]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error creating organization:', error);
        throw error;
    }
}

/**
 * Update an existing organization
 */
export async function updateOrganization(oid: string, orgId: string, orgData: Partial<Organization>): Promise<Organization> {
    const pool = getDbPool();
    
    // Check access
    const hasAccess = await canAccessOrganization(oid, orgId);
    if (!hasAccess) {
        throw new Error('Access denied to this organization');
    }
    
    // Only global admins and domain admins can update organizations
    if (!isGlobalAdmin(oid)) {
        // TODO: Check if user is domain admin
        throw new Error('Only admins can update organizations');
    }
    
    try {
        const result = await pool.query(
            `UPDATE organization SET
                org_type_id = COALESCE($1, org_type_id),
                org_subtype_id = COALESCE($2, org_subtype_id),
                name = COALESCE($3, name),
                is_domain = COALESCE($4, is_domain),
                staff_availability = COALESCE($5, staff_availability),
                organization_attributes = COALESCE($6, organization_attributes),
                start_date = COALESCE($7, start_date),
                end_date = COALESCE($8, end_date),
                updated_at = CURRENT_TIMESTAMP
            WHERE org_id = $9
            RETURNING 
                org_id as id,
                org_type_id,
                org_subtype_id,
                name,
                is_domain,
                staff_availability,
                organization_attributes,
                start_date,
                end_date,
                created_at,
                updated_at`,
            [
                orgData.org_type_id,
                orgData.org_subtype_id,
                orgData.name,
                orgData.is_domain,
                orgData.staff_availability ? JSON.stringify(orgData.staff_availability) : null,
                orgData.organization_attributes ? JSON.stringify(orgData.organization_attributes) : null,
                orgData.start_date,
                orgData.end_date,
                orgId
            ]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Organization not found');
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error updating organization:', error);
        throw error;
    }
}

/**
 * Delete an organization
 */
export async function deleteOrganization(oid: string, orgId: string): Promise<boolean> {
    const pool = getDbPool();
    
    // Check access
    const hasAccess = await canAccessOrganization(oid, orgId);
    if (!hasAccess) {
        throw new Error('Access denied to this organization');
    }
    
    // Only global admins can delete organizations
    if (!isGlobalAdmin(oid)) {
        throw new Error('Only global admins can delete organizations');
    }
    
    try {
        const result = await pool.query(
            'DELETE FROM organization WHERE org_id = $1 RETURNING org_id',
            [orgId]
        );
        
        return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
        console.error('Error deleting organization:', error);
        throw error;
    }
}

/**
 * Get organization types for dropdowns
 */
export async function getOrgTypes(): Promise<Array<{id: string, name: string}>> {
    const pool = getDbPool();
    
    try {
        const result = await pool.query(
            `SELECT org_type_id as id, name 
            FROM org_type 
            WHERE end_date IS NULL OR end_date >= CURRENT_DATE
            ORDER BY name`
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching org types:', error);
        throw error;
    }
}

/**
 * Get the user's organization
 * Returns the first organization the user belongs to via org_persons
 */
export async function getUserOrganization(oid: string): Promise<Organization | null> {
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
            `SELECT o.org_id 
             FROM org_persons op
             JOIN organization o ON op.org_id = o.org_id
             WHERE op.person_id = $1
             LIMIT 1`,
            [personId]
        );
        
        if (orgResult.rows.length === 0) {
            return null;
        }
        
        const orgId = orgResult.rows[0].org_id;
        
        // Get the full organization details
        return await getOrganization(oid, orgId);
    } catch (error) {
        console.error('Error fetching user organization:', error);
        throw error;
    }
}

/**
 * Get organization subtypes for dropdowns
 * @param orgTypeId Optional org_type_id to filter subtypes by type
 */
export async function getOrgSubtypes(orgTypeId?: string): Promise<Array<{id: string, name: string}>> {
    const pool = getDbPool();
    
    try {
        let query: string;
        let params: any[];
        
        if (orgTypeId) {
            query = `SELECT org_subtype_id as id, name 
                FROM org_subtype 
                WHERE org_type_id = $1 
                AND (end_date IS NULL OR end_date >= CURRENT_DATE)
                ORDER BY name`;
            params = [orgTypeId];
        } else {
            query = `SELECT org_subtype_id as id, name 
                FROM org_subtype 
                WHERE end_date IS NULL OR end_date >= CURRENT_DATE
                ORDER BY name`;
            params = [];
        }
        
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('Error fetching org subtypes:', error);
        throw error;
    }
}



