import '../config/load-environment.js';
import { Server } from 'http';
import { createServer } from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';

import Koa from 'koa';
import cors from 'koa2-cors';
import router from './routes.js';
import bodyParser from 'koa-bodyparser';
import { type Environment, environments } from '../config/environments.js';
import { versionString } from '../config/version.js';
import { testConnection } from '../service/db-connection.js';
import { consoleLogInfo, consoleLogSuccess, consoleLogError, consoleLogWarning, consoleLogRaw } from './logging.js';

const moduleName = '[server-starter]';

// Create new Koa application instance
const app = new Koa();
const currentEnv = (process.env.AZURE_ENVIRONMENT || 'local') as Environment;
const env = environments[currentEnv];
const execAsync = promisify(exec);

consoleLogSuccess(moduleName, versionString);
consoleLogSuccess(moduleName, 'Server Environment configured');
consoleLogRaw(JSON.stringify({
    AZURE_ENVIRONMENT: process.env.AZURE_ENVIRONMENT,
    AD_B2C_TENANT: process.env.AD_B2C_TENANT,
    AD_B2C_CLIENT_ID: process.env.AD_B2C_CLIENT_ID,
    environment: currentEnv,
    serverUrl: env.serverUrl,
    serverPort: env.serverPort,
    serverTimeout: env.serverTimeout,
    corsOrigins: env.corsOrigins,
    logLevel: env.logLevel,
    storage: env.storage
}, null, 2));

const dbConfig = {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_NAME: process.env.DB_NAME || 'crchub',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_SSL: process.env.DB_SSL || 'false',
    DATABASE_URL: process.env.DATABASE_URL ? '***SET***' : 'not set'
};
const dbConfigComplete = dbConfig.DB_HOST && dbConfig.DB_NAME && dbConfig.DB_USER;
if (dbConfigComplete) {
    consoleLogSuccess(moduleName, 'Database Configuration');
} else {
    consoleLogWarning(moduleName, 'Database Configuration (incomplete)');
}
consoleLogRaw(JSON.stringify(dbConfig, null, 2));

// Add CORS middleware first
app.use(cors({
    origin: (ctx) => {
        const allowedOrigins = env.corsOrigins;
        const origin = ctx.request.header.origin;
        
        // Log for debugging in local environment
        if (currentEnv === 'local') {
            consoleLogInfo(moduleName, `CORS check: origin=${origin}, isInList=${origin ? allowedOrigins.includes(origin) : false}`);
        }
        
        // If no origin header (shouldn't happen in browser requests, but handle gracefully)
        if (!origin) {
            // For local dev, allow requests without origin
            if (currentEnv === 'local') {
                return allowedOrigins[0];
            }
            return false;
        }
        
        // Normalize origin for comparison (remove trailing slashes if any)
        const normalizedOrigin = origin.trim();
        
        // Check if origin is in allowed list (exact match)
        if (allowedOrigins.includes(normalizedOrigin)) {
            return normalizedOrigin;
        }
        
        // Origin not allowed - deny the request
        if (currentEnv === 'local') {
            consoleLogWarning(moduleName, `CORS blocked: Origin "${normalizedOrigin}" not in allowed list`);
        }
        return false;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
}));

// Add body parser middleware
app.use(bodyParser());

// Global error handling middleware
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        // Log error and set appropriate response
        consoleLogError(moduleName, `Server error: ${String(err)}`);
        ctx.status = (err as any).status || 500;
        ctx.body = {
            message: 'Internal server error',
            // Only show detailed error in non-production environments
            error: process.env.NODE_ENV === 'production' ? undefined : String(err)
        };

        // Ensure CORS headers are set even in error responses
        const origin = ctx.request.header.origin;
        if (origin && env.corsOrigins.includes(origin)) {
            ctx.set('Access-Control-Allow-Origin', origin);
            ctx.set('Access-Control-Allow-Credentials', 'true');
        }
    }
});

// Configure routing
app.use(router.routes());
app.use(router.allowedMethods());

// Test database connection before starting server
consoleLogInfo(moduleName, 'Testing database connection...');
const dbTest = await testConnection();
if (dbTest.success) {
    const version = dbTest.version ? `${dbTest.version.split(' ')[0]} ${dbTest.version.split(' ')[1]}` : 'unknown';
    consoleLogSuccess(moduleName, `Database connection successful (PostgreSQL ${version})`);
} else {
    consoleLogError(moduleName, `Database connection failed: ${dbTest.error}`);
    consoleLogWarning(moduleName, 'Server will start but database operations may fail.');
    consoleLogWarning(moduleName, 'Please check your database configuration and ensure PostgreSQL is running.');
}

// Start the server
let server: Server;
try {
    if (currentEnv === 'local') {
        await killPortProcess(env.serverPort);
    }

    server = app.listen(env.serverPort);

    server.on('error', (err) => {
        consoleLogError(moduleName, `Server startup error: ${String(err)}`);
        process.exit(1);
    });

    server.on('listening', () => {
        consoleLogSuccess(moduleName, `Server now listening on port ${env.serverPort}`);
    });
} catch (err) {
    consoleLogError(moduleName, `Failed to start server: ${String(err)}`);
    process.exit(1);
}

// Global server error handler
server.on('error', (err) => {
    consoleLogError(moduleName, `Server startup error: ${String(err)}`);
    process.exit(1); // Exit on critical errors
});

// Handle process termination
process.on('SIGTERM', () => {
    consoleLogWarning(moduleName, 'SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        consoleLogSuccess(moduleName, 'Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    consoleLogWarning(moduleName, 'SIGINT received. Shutting down gracefully...');
    server.close(() => {
        consoleLogSuccess(moduleName, 'Server closed');
        process.exit(0);
    });
});

async function killPortProcess(port: number): Promise<void> {
    try {
        consoleLogInfo(moduleName, `Attempting to kill process on port ${port}...`);
        const { stdout } = await execAsync(`lsof -i :${port} -t`);
        if (stdout) {
            const pid = stdout.trim();
            await execAsync(`kill -9 ${pid}`);
            consoleLogSuccess(moduleName, `Killed process ${pid} on port ${port}`);
            // Increased wait time
            await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
            consoleLogSuccess(moduleName, `No process found on port ${port}`);
        }
    } catch (error) {
        const errorMsg = String(error);
        // Fix typo in error message if present
        const fixedError = errorMsg.replace('Commannd', 'Command');
        consoleLogWarning(moduleName, `Error checking/killing process on port ${port}: ${fixedError}`);
    }
}

// Export the app instance for testing/importing
export default app;