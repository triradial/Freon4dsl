import { getDbPool } from './db-connection.js';

export interface User {
    oid: string;
    email?: string;
    name?: string;
    facility?: string;
    role?: string;
    is_global_admin?: boolean;
    attributes?: any;
}

/**
 * Get all users
 */
export async function getUsers(): Promise<User[]> {
    const pool = getDbPool();
    
    const result = await pool.query(
        `SELECT 
            p.oid,
            p.email,
            p.name
         FROM person p
         WHERE p.oid IS NOT NULL
         ORDER BY p.name, p.email`
    );

    // Get facility for each user
    const users = await Promise.all(result.rows.map(async (row) => {
        // Get user's facility from org_persons (canonical org membership path)
        const facilityResult = await pool.query(
            `SELECT DISTINCT o.name as facility
             FROM person p
             JOIN org_persons op ON p.person_id = op.person_id
             JOIN organization o ON op.org_id = o.org_id
             WHERE p.oid = $1
             ORDER BY o.name
             LIMIT 1`,
            [row.oid]
        );

        return {
            oid: row.oid,
            email: row.email,
            name: row.name,
            facility: facilityResult.rows[0]?.facility || null
        };
    }));

    return users;
}

/**
 * Get a single user by ID (OID)
 */
export async function getUser(oid: string): Promise<User | null> {
    const pool = getDbPool();
    
    const result = await pool.query(
        `SELECT 
            p.oid,
            p.email,
            p.name
         FROM person p
         WHERE p.oid = $1`,
        [oid]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    
    // Get user's facility - ONLY through org_persons → organization
    // Facility is the organization the person belongs to, NOT the site
    const personIdResult = await pool.query(
        `SELECT person_id FROM person WHERE oid = $1`,
        [oid]
    );
    
    let facility = null;
    if (personIdResult.rows.length > 0) {
        const personId = personIdResult.rows[0].person_id;
        const facilityResult = await pool.query(
            `SELECT DISTINCT o.name as facility
             FROM person p
             JOIN org_persons op ON p.person_id = op.person_id
             JOIN organization o ON op.org_id = o.org_id
             WHERE p.person_id = $1
             ORDER BY o.name
             LIMIT 1`,
            [personId]
        );
        facility = facilityResult.rows[0]?.facility || null;
    }

    // Check if user is a global admin
    const { isGlobalAdmin } = await import('./auth-utils.js');
    const is_global_admin = isGlobalAdmin(row.oid);

    return {
        oid: row.oid,
        email: row.email,
        name: row.name,
        facility: facility,
        is_global_admin
    };
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const pool = getDbPool();
    const moduleName = '[user-service]';
    
    console.log(`${moduleName} [getUserByEmail] Looking up user with email: ${email}`);
    
    const result = await pool.query(
        `SELECT 
            p.oid,
            p.email,
            p.name
         FROM person p
         WHERE p.email = $1`,
        [email]
    );

    if (result.rows.length === 0) {
        console.log(`${moduleName} [getUserByEmail] No user found with email: ${email}`);
        return null;
    }

    const row = result.rows[0];
    console.log(`${moduleName} [getUserByEmail] Found user: oid=${row.oid}, name=${row.name}`);
    
    // Get user's facility - ONLY through org_persons → organization
    // Facility is the organization the person belongs to, NOT the site
    console.log(`${moduleName} [getUserByEmail] Looking up facility for oid=${row.oid}`);
    
    // Get the person_id for the joins
    const personIdResult = await pool.query(
        `SELECT person_id FROM person WHERE oid = $1`,
        [row.oid]
    );
    
    if (personIdResult.rows.length === 0) {
        console.log(`${moduleName} [getUserByEmail] ERROR: Could not find person_id for oid=${row.oid}`);
        // Return user without facility
        const { isGlobalAdmin } = await import('./auth-utils.js');
        const is_global_admin = isGlobalAdmin(row.oid);
        return {
            oid: row.oid,
            email: row.email,
            name: row.name,
            facility: null,
            is_global_admin
        };
    }
    
    const personId = personIdResult.rows[0].person_id;
    console.log(`${moduleName} [getUserByEmail] Found person_id=${personId} for oid=${row.oid}`);
    
    // Get facility directly from org_persons → organization
    // This is the organization (facility) the person belongs to
    console.log(`${moduleName} [getUserByEmail] Looking up facility via org_persons → organization`);
    const facilityResult = await pool.query(
        `SELECT DISTINCT o.name as facility, o.org_id
         FROM person p
         JOIN org_persons op ON p.person_id = op.person_id
         JOIN organization o ON op.org_id = o.org_id
         WHERE p.person_id = $1
         ORDER BY o.name
         LIMIT 1`,
        [personId]
    );
    
    let facility = facilityResult.rows[0]?.facility || null;
    const orgId = facilityResult.rows[0]?.org_id || null;
    console.log(`${moduleName} [getUserByEmail] Facility lookup result: facility=${facility || 'null'}, org_id=${orgId || 'null'}`);
    
    if (!facility) {
        // Debug: Check if person has any org_persons entries
        const debugResult = await pool.query(
            `SELECT op.org_person_id, op.org_id, o.name as org_name
             FROM org_persons op
             LEFT JOIN organization o ON op.org_id = o.org_id
             WHERE op.person_id = $1`,
            [personId]
        );
        console.log(`${moduleName} [getUserByEmail] DEBUG: Found ${debugResult.rows.length} org_persons entries for person_id=${personId}`);
        if (debugResult.rows.length > 0) {
            console.log(`${moduleName} [getUserByEmail] DEBUG: org_persons entries:`, debugResult.rows.map(r => ({ org_person_id: r.org_person_id, org_id: r.org_id, org_name: r.org_name })));
        } else {
            console.log(`${moduleName} [getUserByEmail] WARNING: Person ${personId} (${row.name}) has NO org_persons entries - they are not assigned to any organization`);
        }
    }
    
    if (!facility) {
        console.log(`${moduleName} [getUserByEmail] WARNING: User ${row.oid} (${row.name}) has no facility assigned`);
        console.log(`${moduleName} [getUserByEmail] User is not linked to any organization via org_persons or site_persons`);
    } else {
        console.log(`${moduleName} [getUserByEmail] Facility found: ${facility}`);
    }

    // Check if user is a global admin
    const { isGlobalAdmin } = await import('./auth-utils.js');
    const is_global_admin = isGlobalAdmin(row.oid);
    console.log(`${moduleName} [getUserByEmail] isGlobalAdmin(${row.oid})=${is_global_admin}`);

    const user = {
        oid: row.oid,
        email: row.email,
        name: row.name,
        facility: facility,
        is_global_admin
    };
    
    console.log(`${moduleName} [getUserByEmail] Returning user:`, { oid: user.oid, name: user.name, facility: user.facility, is_global_admin: user.is_global_admin });
    return user;
}

/**
 * Create a new user
 */
export async function createUser(userData: User): Promise<User> {
    const pool = getDbPool();
    
    const { oid, email, name, facility, ...attributes } = userData;
    
    const result = await pool.query(
        `INSERT INTO person (oid, email, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (oid) DO UPDATE SET
             email = EXCLUDED.email,
             name = EXCLUDED.name
         RETURNING oid, email, name`,
        [oid, email || null, name || null]
    );

    const row = result.rows[0];

    // If facility is provided, link user to a site in that facility
    if (facility) {
        const orgResult = await pool.query(
            `SELECT org_id FROM organization WHERE name = $1 LIMIT 1`,
            [facility]
        );
        
        if (orgResult.rows.length > 0) {
            const orgId = orgResult.rows[0].org_id;
            const personResult = await pool.query(
                `SELECT person_id FROM person WHERE oid = $1`,
                [oid]
            );
            const personId = personResult.rows[0].person_id;
            
            // Get or create a site for this org
            const siteResult = await pool.query(
                `SELECT site_id FROM site WHERE org_id = $1 LIMIT 1`,
                [orgId]
            );
            
            if (siteResult.rows.length > 0) {
                const siteId = siteResult.rows[0].site_id;
                // Link person to site
                await pool.query(
                    `INSERT INTO site_persons (site_id, person_id)
                     VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [siteId, personId]
                );
            }
        }
    }

    return {
        oid: row.oid,
        email: row.email,
        name: row.name,
        facility: facility || null
    };
}

/**
 * Update an existing user
 */
export async function updateUser(oid: string, userData: Partial<User>): Promise<User | null> {
    const pool = getDbPool();
    
    const { email, name, facility, ...attributes } = userData;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
    }
    if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
    }

    if (updates.length === 0) {
        return await getUser(oid);
    }

    values.push(oid);
    const result = await pool.query(
        `UPDATE person 
         SET ${updates.join(', ')}
         WHERE oid = $${paramIndex}
         RETURNING oid, email, name`,
        values
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    
    // Update facility if provided
    let facilityKey = null;
    if (facility !== undefined) {
        const orgResult = await pool.query(
            `SELECT org_id FROM organization WHERE name = $1 LIMIT 1`,
            [facility]
        );
        
        if (orgResult.rows.length > 0) {
            const orgId = orgResult.rows[0].org_id;
            const personResult = await pool.query(
                `SELECT person_id FROM person WHERE oid = $1`,
                [oid]
            );
            const personId = personResult.rows[0].person_id;
            
            // Get or create a site for this org
            const siteResult = await pool.query(
                `SELECT site_id FROM site WHERE org_id = $1 LIMIT 1`,
                [orgId]
            );
            
            if (siteResult.rows.length > 0) {
                const siteId = siteResult.rows[0].site_id;
                // Link person to site
                await pool.query(
                    `INSERT INTO site_persons (site_id, person_id)
                     VALUES ($1, $2)
                     ON CONFLICT DO NOTHING`,
                    [siteId, personId]
                );
            }
        }
        facilityKey = facility;
    } else {
        // Get existing facility - ONLY through org_persons → organization
        const personIdResult = await pool.query(
            `SELECT person_id FROM person WHERE oid = $1`,
            [oid]
        );
        
        if (personIdResult.rows.length > 0) {
            const personId = personIdResult.rows[0].person_id;
            const facilityResult = await pool.query(
                `SELECT DISTINCT o.name as facility
                 FROM person p
                 JOIN org_persons op ON p.person_id = op.person_id
                 JOIN organization o ON op.org_id = o.org_id
                 WHERE p.person_id = $1
                 ORDER BY o.name
                 LIMIT 1`,
                [personId]
            );
            facilityKey = facilityResult.rows[0]?.facility || null;
        }
    }

    return {
        oid: row.oid,
        email: row.email,
        name: row.name,
        facility: facilityKey
    };
}

/**
 * Delete a user
 */
export async function deleteUser(oid: string): Promise<boolean> {
    const pool = getDbPool();
    
    const result = await pool.query(
        `DELETE FROM person WHERE oid = $1`,
        [oid]
    );

    return result.rowCount !== null && result.rowCount > 0;
}
