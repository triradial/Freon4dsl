import { getDbPool } from './db-connection.js';
import { isGlobalAdmin, canAccessPerson } from './auth-utils.js';

export interface Person {
    id: string;
    oid?: string;
    email?: string;
    name?: string;
    active?: boolean;
    password_hash?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PersonWithOrganizations extends Person {
    organizations?: Array<{
        org_id: string;
        org_name: string;
        org_type_name?: string;
        role_id: string;
        role_name: string;
        is_domain_admin: boolean;
    }>;
    has_login: boolean;
    is_global_admin: boolean;
    is_domain_admin: boolean;
    active?: boolean;
    password_hash?: string;
}

/**
 * Get all persons accessible by the user
 * - Global admins: all persons
 * - Domain admins: persons in their domain organizations
 * - Regular users: persons in their organizations
 */
export async function getPersons(oid: string): Promise<PersonWithOrganizations[]> {
    const pool = getDbPool();
    const moduleName = '[person-service]';
    
    try {
        console.log(`${moduleName} [getPersons] Starting with oid=${oid}`);
        let query: string;
        let params: any[];
        
        const isAdmin = isGlobalAdmin(oid);
        console.log(`${moduleName} [getPersons] isGlobalAdmin(${oid})=${isAdmin}`);
        
        if (isAdmin) {
            // Global admins see all persons
            console.log(`${moduleName} [getPersons] Using global admin query (all persons)`);
            query = `
                SELECT 
                    p.person_id as id,
                    p.oid,
                    p.email,
                    p.name,
                    p.active,
                    p.password_hash,
                    p.created_at,
                    p.updated_at,
                    CASE WHEN p.oid IS NOT NULL THEN true ELSE false END as has_login
                FROM person p
                ORDER BY p.name
            `;
            params = [];
        } else {
            // Non-global admins see only persons in their organizations
            console.log(`${moduleName} [getPersons] Using non-admin query (filtered by org)`);
            query = `
                SELECT DISTINCT
                    p.person_id as id,
                    p.oid,
                    p.email,
                    p.name,
                    p.active,
                    p.password_hash,
                    p.created_at,
                    p.updated_at,
                    CASE WHEN p.oid IS NOT NULL THEN true ELSE false END as has_login
                FROM person p
                INNER JOIN org_persons op1 ON p.person_id = op1.person_id
                WHERE op1.org_id IN (
                    SELECT op2.org_id
                    FROM org_persons op2
                    INNER JOIN person p2 ON op2.person_id = p2.person_id
                    WHERE p2.oid = $1
                )
                ORDER BY p.name
            `;
            params = [oid];
        }
        
        console.log(`${moduleName} [getPersons] Executing query with params:`, params);
        const result = await pool.query(query, params);
        const persons = result.rows;
        console.log(`${moduleName} [getPersons] Query returned ${persons.length} persons`);
        
        // For each person, fetch their organization relationships and normalize active field
        console.log(`${moduleName} [getPersons] Processing ${persons.length} persons to add organization data`);
        const personsWithOrgs = await Promise.all(
            persons.map(async (person, index) => {
                try {
                    const orgs = await getPersonOrganizations(person.id);
                    const isDomainAdmin = orgs.some(org => org.is_domain_admin);
                    const isGlobalAdminUser = person.oid ? isGlobalAdmin(person.oid) : false;
                    
                    // Normalize active field - handle boolean, text "True"/"true", or null/undefined
                    let normalizedActive = false;
                    const activeValue = person.active;
                    if (activeValue === true || activeValue === 'true' || activeValue === 'True' || 
                        (typeof activeValue === 'string' && activeValue.toLowerCase() === 'true')) {
                        normalizedActive = true;
                    }
                    
                    const personWithOrgs = {
                        ...person,
                        active: normalizedActive,
                        organizations: orgs,
                        is_global_admin: isGlobalAdminUser,
                        is_domain_admin: isDomainAdmin
                    };
                    
                    if (index < 3) { // Log first 3 for debugging
                        console.log(`${moduleName} [getPersons] Person ${index + 1}: ${person.name}, orgs: ${orgs.length}`);
                    }
                    
                    return personWithOrgs;
                } catch (personError) {
                    console.error(`${moduleName} [getPersons] Error processing person ${person.id}:`, personError);
                    throw personError;
                }
            })
        );
        
        console.log(`${moduleName} [getPersons] Successfully processed ${personsWithOrgs.length} persons with organizations`);
        return personsWithOrgs;
    } catch (error) {
        console.error(`${moduleName} [getPersons] Error fetching persons:`, error);
        if (error instanceof Error) {
            console.error(`${moduleName} [getPersons] Error stack:`, error.stack);
        }
        throw error;
    }
}

/**
 * Get a single person by ID
 */
export async function getPerson(oid: string, personId: string): Promise<PersonWithOrganizations | null> {
    const pool = getDbPool();
    
    // Check access
    const hasAccess = await canAccessPerson(oid, personId);
    if (!hasAccess) {
        throw new Error('Access denied to this person');
    }
    
    try {
        const result = await pool.query(
            `SELECT 
                p.person_id as id,
                p.oid,
                p.email,
                p.name,
                COALESCE(p.active, false) as active,
                p.password_hash,
                p.created_at,
                p.updated_at,
                CASE WHEN p.oid IS NOT NULL THEN true ELSE false END as has_login
            FROM person p
            WHERE p.person_id = $1`,
            [personId]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const person = result.rows[0];
        const orgs = await getPersonOrganizations(personId);
        const isDomainAdmin = orgs.some(org => org.is_domain_admin);
        const isGlobalAdminUser = person.oid ? isGlobalAdmin(person.oid) : false;
        
        return {
            ...person,
            organizations: orgs,
            is_global_admin: isGlobalAdminUser,
            is_domain_admin: isDomainAdmin
        };
    } catch (error) {
        console.error('Error fetching person:', error);
        throw error;
    }
}

/**
 * Get organization relationships for a person
 */
export async function getPersonOrganizations(personId: string): Promise<Array<{
    org_id: string;
    org_name: string;
    org_type_name?: string;
    role_id: string;
    role_name: string;
    is_domain_admin: boolean;
}>> {
    const pool = getDbPool();
    
    try {
        const result = await pool.query(
            `SELECT 
                o.org_id,
                o.name as org_name,
                ot.name as org_type_name,
                pr.role_id,
                pr.name as role_name,
                opr.is_domain_admin
            FROM org_persons op
            JOIN organization o ON op.org_id = o.org_id
            LEFT JOIN org_type ot ON o.org_type_id = ot.org_type_id
            JOIN org_person_roles opr ON op.org_person_id = opr.org_person_id
            JOIN person_role pr ON opr.role_id = pr.role_id
            WHERE op.person_id = $1
            AND (opr.end_date IS NULL OR opr.end_date >= CURRENT_DATE)
            ORDER BY o.name, pr.name`,
            [personId]
        );
        
        return result.rows;
    } catch (error) {
        console.error('Error fetching person organizations:', error);
        throw error;
    }
}

/**
 * Create a new person
 */
export async function createPerson(oid: string, personData: Omit<Person, 'id'> & { orgId?: string; roleId?: string }): Promise<Person> {
    const pool = getDbPool();
    
    // Only global admins and domain admins can create persons
    if (!isGlobalAdmin(oid)) {
        // TODO: Check if user is domain admin
        throw new Error('Only admins can create persons');
    }
    
    // Validate required fields
    if (!personData.email || !personData.email.trim()) {
        throw new Error('Email is required');
    }
    if (!personData.orgId || !personData.orgId.trim()) {
        throw new Error('Organization is required');
    }
    if (!personData.roleId || !personData.roleId.trim()) {
        throw new Error('Role is required');
    }
    
    try {
        // Handle active field - default to true if not provided, but respect false if explicitly set
        const activeValue = personData.active !== undefined ? personData.active : true;
        
        const result = await pool.query(
            `INSERT INTO person (
                oid, email, name, active
            ) VALUES ($1, $2, $3, $4)
            RETURNING 
                person_id as id,
                oid,
                email,
                name,
                active,
                created_at,
                updated_at`,
            [
                personData.oid || null,
                personData.email || null,
                personData.name || null,
                activeValue
            ]
        );
        
        const person = result.rows[0];
        
        // If organization and role are provided, link the person to the organization with the role
        if (personData.orgId && personData.roleId) {
            await addPersonToOrganization(oid, person.id, personData.orgId, personData.roleId, false);
        }
        
        return person;
    } catch (error) {
        console.error('Error creating person:', error);
        throw error;
    }
}

/**
 * Update an existing person
 */
export async function updatePerson(oid: string, personId: string, personData: Partial<Person> & { orgId?: string; roleId?: string }): Promise<Person> {
    const pool = getDbPool();
    
    // Check access
    const hasAccess = await canAccessPerson(oid, personId);
    if (!hasAccess) {
        throw new Error('Access denied to this person');
    }
    
    // Only global admins and domain admins can update persons
    if (!isGlobalAdmin(oid)) {
        // TODO: Check if user is domain admin
        throw new Error('Only admins can update persons');
    }
    
    try {
        // Build dynamic update query for active field
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;
        
        if (personData.oid !== undefined) {
            updates.push(`oid = $${paramIndex++}`);
            values.push(personData.oid);
        }
        if (personData.email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            values.push(personData.email);
        }
        if (personData.name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(personData.name);
        }
        if (personData.active !== undefined) {
            updates.push(`active = $${paramIndex++}`);
            values.push(personData.active);
        }
        
        // Always update updated_at
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        
        if (updates.length === 0) {
            // No fields to update, just return the person
            const result = await pool.query(
                `SELECT person_id as id, oid, email, name, active, created_at, updated_at
                 FROM person WHERE person_id = $1`,
                [personId]
            );
            if (result.rows.length === 0) {
                throw new Error('Person not found');
            }
            return result.rows[0];
        }
        
        values.push(personId);
        const result = await pool.query(
            `UPDATE person SET
                ${updates.join(', ')}
            WHERE person_id = $${paramIndex}
            RETURNING 
                person_id as id,
                oid,
                email,
                name,
                active,
                created_at,
                updated_at`,
            values
        );
        
        if (result.rows.length === 0) {
            throw new Error('Person not found');
        }
        
        // Handle organization and role updates
        if (personData.orgId !== undefined && personData.roleId !== undefined) {
            // Get current organization relationships
            const currentOrgs = await getPersonOrganizations(personId);
            
            // Check if the organization/role combination already exists
            const existingOrg = currentOrgs.find(org => org.org_id === personData.orgId && org.role_id === personData.roleId);
            
            if (!existingOrg) {
                // Remove person from all current organizations (set end_date on roles)
                for (const org of currentOrgs) {
                    await removePersonFromOrganization(oid, personId, org.org_id, org.role_id);
                }
                
                // Add person to the new organization with the new role
                await addPersonToOrganization(oid, personId, personData.orgId, personData.roleId, false);
            }
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error updating person:', error);
        throw error;
    }
}

/**
 * Delete a person
 */
export async function deletePerson(oid: string, personId: string): Promise<boolean> {
    const pool = getDbPool();
    
    // Check access
    const hasAccess = await canAccessPerson(oid, personId);
    if (!hasAccess) {
        throw new Error('Access denied to this person');
    }
    
    // Only global admins can delete persons
    if (!isGlobalAdmin(oid)) {
        throw new Error('Only global admins can delete persons');
    }
    
    try {
        const result = await pool.query(
            'DELETE FROM person WHERE person_id = $1 RETURNING person_id',
            [personId]
        );
        
        return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
        console.error('Error deleting person:', error);
        throw error;
    }
}

/**
 * Add a person to an organization with a role
 */
export async function addPersonToOrganization(
    oid: string,
    personId: string,
    orgId: string,
    roleId: string,
    isDomainAdmin: boolean = false
): Promise<void> {
    const pool = getDbPool();
    
    // Only global admins and domain admins can add persons to organizations
    if (!isGlobalAdmin(oid)) {
        // TODO: Check if user is domain admin for this org
        throw new Error('Only admins can add persons to organizations');
    }
    
    try {
        // First, check if org_persons link exists
        const orgPersonCheck = await pool.query(
            `SELECT org_person_id FROM org_persons 
            WHERE org_id = $1 AND person_id = $2`,
            [orgId, personId]
        );
        
        let orgPersonId;
        if (orgPersonCheck.rows.length > 0) {
            orgPersonId = orgPersonCheck.rows[0].org_person_id;
        } else {
            // Create org_persons link
            const orgPersonResult = await pool.query(
                `INSERT INTO org_persons (org_id, person_id) 
                VALUES ($1, $2) 
                RETURNING org_person_id`,
                [orgId, personId]
            );
            orgPersonId = orgPersonResult.rows[0].org_person_id;
        }
        
        // Now add the role
        await pool.query(
            `INSERT INTO org_person_roles (
                org_person_id, role_id, is_domain_admin
            ) VALUES ($1, $2, $3)`,
            [orgPersonId, roleId, isDomainAdmin]
        );
    } catch (error) {
        console.error('Error adding person to organization:', error);
        throw error;
    }
}

/**
 * Remove a person's role from an organization (set end_date)
 */
export async function removePersonFromOrganization(
    oid: string,
    personId: string,
    orgId: string,
    roleId: string
): Promise<void> {
    const pool = getDbPool();
    
    // Only global admins and domain admins can remove persons from organizations
    if (!isGlobalAdmin(oid)) {
        // TODO: Check if user is domain admin for this org
        throw new Error('Only admins can remove persons from organizations');
    }
    
    try {
        await pool.query(
            `UPDATE org_person_roles opr
            SET end_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
            FROM org_persons op
            WHERE op.org_person_id = opr.org_person_id
            AND op.org_id = $1 
            AND op.person_id = $2 
            AND opr.role_id = $3`,
            [orgId, personId, roleId]
        );
    } catch (error) {
        console.error('Error removing person from organization:', error);
        throw error;
    }
}

/**
 * Get unavailable dates for a person in an organization
 * Now reads from org_persons.availability column
 */
export async function getPersonUnavailableDates(
    oid: string,
    personId: string,
    orgId: string
): Promise<string[]> {
    const pool = getDbPool();
    
    // Check access
    if (!isGlobalAdmin(oid) && !(await canAccessPerson(oid, personId))) {
        throw new Error('Access denied to person data');
    }
    
    try {
        const result = await pool.query(
            `SELECT availability
             FROM org_persons
             WHERE person_id = $1 AND org_id = $2`,
            [personId, orgId]
        );
        
        if (result.rows.length === 0) {
            return [];
        }
        
        const availability = result.rows[0].availability || {};
        return availability.unavailable || [];
    } catch (error) {
        console.error('Error fetching person unavailable dates:', error);
        throw error;
    }
}

/**
 * Set unavailable dates for a person in an organization
 * Now writes to org_persons.availability column
 */
export async function setPersonUnavailableDates(
    oid: string,
    personId: string,
    orgId: string,
    unavailableDates: string[]
): Promise<void> {
    const pool = getDbPool();
    
    // Check access
    if (!isGlobalAdmin(oid) && !(await canAccessPerson(oid, personId))) {
        throw new Error('Access denied to modify person data');
    }
    
    try {
        // Sort dates
        const sortedDates = [...unavailableDates].sort();
        const availability = {
            unavailable: sortedDates
        };
        
        // Update the availability JSONB column
        await pool.query(
            `UPDATE org_persons
             SET availability = $1
             WHERE person_id = $2 AND org_id = $3`,
            [JSON.stringify(availability), personId, orgId]
        );
        
        console.log(`[person-service] Set unavailable dates for person ${personId} in org ${orgId}:`, unavailableDates);
    } catch (error) {
        console.error('Error setting person unavailable dates:', error);
        throw error;
    }
}

/**
 * Get person roles for dropdowns
 */
export async function getPersonRoles(): Promise<Array<{id: string, name: string, category: string}>> {
    const pool = getDbPool();
    
    try {
        const result = await pool.query(
            `SELECT 
                pr.role_id as id, 
                pr.name,
                rc.name as category
            FROM person_role pr
            LEFT JOIN role_category rc ON pr.category_id = rc.role_category_id
            WHERE pr.end_date IS NULL OR pr.end_date >= CURRENT_DATE
            ORDER BY rc.name, pr.name`
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching person roles:', error);
        throw error;
    }
}



