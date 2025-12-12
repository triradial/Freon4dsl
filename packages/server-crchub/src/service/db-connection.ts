import pg from 'pg';
const { Pool } = pg;
import { consoleLogInfo, consoleLogSuccess, consoleLogError, consoleLogWarning } from '../server/logging.js';

const moduleName = '[db-connection]';

let pool: pg.Pool | null = null;

/**
 * Get or create the database connection pool
 */
export function getDbPool(): pg.Pool {
    if (!pool) {
        // Get and validate password - trim any whitespace and remove quotes if present
        let dbPassword = process.env.DB_PASSWORD;
        if (dbPassword) {
            // Remove surrounding quotes if present (common .env file issue)
            dbPassword = dbPassword.trim();
            if ((dbPassword.startsWith('"') && dbPassword.endsWith('"')) || 
                (dbPassword.startsWith("'") && dbPassword.endsWith("'"))) {
                dbPassword = dbPassword.slice(1, -1);
            }
        }
        
        const dbUser = process.env.DB_USER || 'postgres';
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = process.env.DB_PORT || '5432';
        const dbName = process.env.DB_NAME || 'crchub';
        
        // Check if password is provided
        if (!dbPassword && !process.env.DATABASE_URL) {
            consoleLogWarning(moduleName, 'DB_PASSWORD is not set. Database connection may fail.');
            consoleLogWarning(moduleName, '💡 If your password starts with #, you must quote it in .env: DB_PASSWORD="#2Pencil"');
        } else if (dbPassword) {
            // Verify password is a string (not null/undefined)
            if (typeof dbPassword !== 'string') {
                consoleLogError(moduleName, `DB_PASSWORD is not a string (type: ${typeof dbPassword}). This will cause connection to fail.`);
            } else if (dbPassword.length === 0) {
                consoleLogWarning(moduleName, 'DB_PASSWORD is set but empty. Database connection may fail.');
                consoleLogWarning(moduleName, '💡 If your password starts with #, you must quote it in .env: DB_PASSWORD="#2Pencil"');
            } else {
                consoleLogInfo(moduleName, `DB_PASSWORD is set (length: ${dbPassword.length} characters)`);
            }
        }
        
        // Build connection string - use Pool config directly instead of connection string for better password handling
        let poolConfig: any;
        
        if (process.env.DATABASE_URL) {
            poolConfig = {
                connectionString: process.env.DATABASE_URL,
            };
        } else {
            // Use individual parameters instead of connection string to avoid encoding issues
            poolConfig = {
                host: dbHost,
                port: parseInt(dbPort, 10),
                database: dbName,
                user: dbUser,
                password: dbPassword || undefined, // Pass undefined if empty, not empty string
            };
        }
        
        // Determine if we're connecting to a remote host
        const isRemoteHost = dbHost !== 'localhost' && dbHost !== '127.0.0.1' && !dbHost.startsWith('localhost');
        
        // Determine SSL setting
        const dbSsl = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';
        const sslConfig = dbSsl ? { rejectUnauthorized: false } : false;
        
        // Log connection info (without password)
        const connectionInfo = process.env.DATABASE_URL 
            ? 'DATABASE_URL (connection string)'
            : `postgresql://${dbUser}:***@${dbHost}:${dbPort}/${dbName}`;
        consoleLogInfo(moduleName, `Initializing database connection pool: ${connectionInfo}`);
        
        // Warn if connecting to remote host without SSL
        if (isRemoteHost && !dbSsl) {
            consoleLogWarning(moduleName, `Connecting to remote host (${dbHost}) without SSL. If connection fails, set DB_SSL=true`);
        }
        
        if (dbSsl) {
            consoleLogInfo(moduleName, 'SSL enabled for database connection');
        }
        
        // Add SSL and pool settings
        poolConfig.ssl = sslConfig;
        poolConfig.max = 3;  // Reduced from 20 to 3 for development
        poolConfig.idleTimeoutMillis = 10000;  // Reduced from 30s to 10s
        poolConfig.connectionTimeoutMillis = 2000;
        
        pool = new Pool(poolConfig);

        pool.on('error', (err) => {
            consoleLogError(moduleName, `Unexpected error on idle client: ${String(err)}`);
        });
        
        consoleLogSuccess(moduleName, 'Database connection pool created');
    }
    return pool;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<{ success: boolean; error?: string; version?: string }> {
    try {
        const testPool = getDbPool();
        const result = await testPool.query('SELECT version()');
        const version = result.rows[0]?.version || 'unknown';
        return { success: true, version };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if error is about SSL/encryption requirement
        if (errorMessage.includes('no pg_hba.conf entry') && errorMessage.includes('no encryption')) {
            const dbHost = process.env.DB_HOST || 'localhost';
            const isRemoteHost = dbHost !== 'localhost' && dbHost !== '127.0.0.1' && !dbHost.startsWith('localhost');
            
            if (isRemoteHost && process.env.DB_SSL !== 'true') {
                return { 
                    success: false, 
                    error: `${errorMessage}\n   💡 Suggestion: Set DB_SSL=true in your .env file for remote database connections.` 
                };
            }
        }
        
        // Check if error is about missing password
        if (errorMessage.includes('password must be a string') || errorMessage.includes('SASL')) {
            if (!process.env.DB_PASSWORD && !process.env.DATABASE_URL) {
                return { 
                    success: false, 
                    error: `${errorMessage}\n   💡 Suggestion: Set DB_PASSWORD in your .env file or use DATABASE_URL with password included.\n   💡 If your password starts with #, you must quote it: DB_PASSWORD="#2Pencil"` 
                };
            } else if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.trim().length === 0) {
                return { 
                    success: false, 
                    error: `${errorMessage}\n   💡 Issue: DB_PASSWORD appears to be empty. If your password starts with #, dotenv treats it as a comment.\n   💡 Solution: Quote the password in .env: DB_PASSWORD="#2Pencil"` 
                };
            }
        }
        
        return { success: false, error: errorMessage };
    }
}

/**
 * Close the database connection pool
 */
export async function closeDbPool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

