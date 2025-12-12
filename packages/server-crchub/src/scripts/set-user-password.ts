/**
 * Utility script to set a password for a user in the database
 * 
 * Usage:
 * npm run build
 * node dist/scripts/set-user-password.js <email> <password>
 * 
 * Example:
 * node dist/scripts/set-user-password.js user@example.com MyPassword123
 */

import '../config/load-environment.js';
import { getDbPool } from '../service/db-connection.js';
// Use createRequire to import CommonJS module in ES module context
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

async function setUserPassword(email: string, password: string) {
    const pool = getDbPool();
    
    try {
        console.log(`Setting password for user: ${email}`);
        
        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Update the user's password in the database
        const result = await pool.query(
            `UPDATE person 
             SET password_hash = $1, active = true
             WHERE email = $2
             RETURNING oid, email, name, active`,
            [passwordHash, email]
        );
        
        if (result.rows.length === 0) {
            console.error(`❌ User not found with email: ${email}`);
            console.log('\nMake sure the user exists in the person table with the correct email address.');
            process.exit(1);
        }
        
        const user = result.rows[0];
        console.log(`✅ Password set successfully for user:`);
        console.log(`   OID: ${user.oid}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Active: ${user.active}`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error setting password:', error);
        process.exit(1);
    }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
    console.error('Usage: node dist/scripts/set-user-password.js <email> <password>');
    console.error('Example: node dist/scripts/set-user-password.js user@example.com MyPassword123');
    process.exit(1);
}

const [email, password] = args;

// Validate email format
if (!email.includes('@')) {
    console.error('❌ Invalid email format');
    process.exit(1);
}

// Validate password strength
if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
}

setUserPassword(email, password);

