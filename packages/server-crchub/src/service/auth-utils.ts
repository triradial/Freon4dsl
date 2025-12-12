import { getDbPool } from './db-connection.js';

/**
 * Authorization utilities for user management
 */

/**
 * Check if a user is a global admin
 * Global admins are identified by the GLOBAL_ADMIN environment variable (comma-separated OIDs)
 */
export function isGlobalAdmin(oid: string): boolean {
    const globalAdminOids = process.env.GLOBAL_ADMIN || '';
    const adminList = globalAdminOids.split(',').map(u => u.trim()).filter(u => u.length > 0);
    console.log(`[isGlobalAdmin] Checking oid: ${oid}`);
    console.log(`[isGlobalAdmin] GLOBAL_ADMIN env var: "${globalAdminOids}"`);
    console.log(`[isGlobalAdmin] Admin list: [${adminList.join(', ')}]`);
    const result = adminList.includes(oid);
    console.log(`[isGlobalAdmin] Result: ${result}`);
    return result;
}

/**
 * Check if a user is a domain admin for any organization
 */
export async function isDomainAdmin(oid: string): Promise<boolean> {
    const pool = getDbPool();
    try {
        const result = await pool.query(
            `SELECT EXISTS(
                SELECT 1 
                FROM org_persons op
                JOIN org_person_roles opr ON op.org_person_id = opr.org_person_id
                JOIN person p ON p.person_id = op.person_id
                WHERE p.oid = $1
                AND opr.is_domain_admin = true
                AND (opr.end_date IS NULL OR opr.end_date >= CURRENT_DATE)
            ) as is_admin`,
            [oid]
        );
        return result.rows[0]?.is_admin || false;
    } catch (error) {
        console.error('Error checking domain admin status:', error);
        return false;
    }
}

/**
 * Get the organization IDs that a user has access to
 * - Global admins: all organizations
 * - Domain admins: organizations within their domain(s)
 * - Regular users: organizations they are associated with
 */
export async function getUserDomainOrgs(oid: string): Promise<string[]> {
    const pool = getDbPool();
    
    // Global admins have access to everything
    if (isGlobalAdmin(oid)) {
        const result = await pool.query('SELECT org_id FROM organization');
        return result.rows.map(row => row.org_id);
    }

    try {
        // Get organizations the user is associated with
        const result = await pool.query(
            `SELECT DISTINCT op.org_id
            FROM org_persons op
            JOIN person p ON p.person_id = op.person_id
            WHERE p.oid = $1`,
            [oid]
        );
        
        const userOrgIds = result.rows.map(row => row.org_id);
        
        // If user is a domain admin, also include all organizations in their domain(s)
        const domainAdminResult = await pool.query(
            `SELECT DISTINCT o.org_id
            FROM org_persons op
            JOIN org_person_roles opr ON op.org_person_id = opr.org_person_id
            JOIN person p ON p.person_id = op.person_id
            JOIN organization o ON o.org_id = op.org_id
            WHERE p.oid = $1
            AND opr.is_domain_admin = true
            AND o.is_domain = true
            AND (opr.end_date IS NULL OR opr.end_date >= CURRENT_DATE)`,
            [oid]
        );
        
        // For each domain the user is admin of, get all organizations in that domain
        // For now, we'll just return the user's associated organizations
        // Domain isolation logic can be enhanced based on specific requirements
        
        return [...new Set(userOrgIds)];
    } catch (error) {
        console.error('Error getting user domain orgs:', error);
        return [];
    }
}

/**
 * Check if a user can access a specific organization
 */
export async function canAccessOrganization(oid: string, orgId: string): Promise<boolean> {
    const pool = getDbPool();
    
    // Global admins can access everything
    if (isGlobalAdmin(oid)) {
        return true;
    }

    try {
        const result = await pool.query(
            `SELECT EXISTS(
                SELECT 1 
                FROM org_persons op
                JOIN person p ON p.person_id = op.person_id
                WHERE p.oid = $1 
                AND op.org_id = $2
            ) as can_access`,
            [oid, orgId]
        );
        return result.rows[0]?.can_access || false;
    } catch (error) {
        console.error('Error checking organization access:', error);
        return false;
    }
}

/**
 * Check if a user can access a specific person
 * - Global admins: all persons
 * - Domain admins: persons in their domain organizations
 * - Regular users: persons in their organizations
 */
export async function canAccessPerson(oid: string, personId: string): Promise<boolean> {
    const pool = getDbPool();
    
    // Global admins can access everything
    if (isGlobalAdmin(oid)) {
        return true;
    }

    try {
        // Check if the person shares any organization with the user
        const result = await pool.query(
            `SELECT EXISTS(
                SELECT 1
                FROM org_persons op1
                JOIN person p1 ON p1.person_id = op1.person_id
                WHERE p1.oid = $1
                AND op1.org_id IN (
                    SELECT op2.org_id
                    FROM org_persons op2
                    WHERE op2.person_id = $2
                )
            ) as can_access`,
            [oid, personId]
        );
        return result.rows[0]?.can_access || false;
    } catch (error) {
        console.error('Error checking person access:', error);
        return false;
    }
}

