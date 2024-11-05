// Import required dependencies
import { Server } from 'http';
import { createServer } from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';

import Koa from 'koa';
import cors from '@koa/cors';
import router from './routes.js';
import bodyParser from 'koa-bodyparser';
import { type Environment, environments } from '../config/environments.js';

// Create new Koa application instance
const app = new Koa();
const currentEnv = 'local' as Environment;
const env = environments[currentEnv];
const execAsync = promisify(exec);

console.log('Server Environment:', {
    AZURE_ENVIRONMENT: process.env.AZURE_ENVIRONMENT,
    environment: currentEnv,
    serverUrl: env.serverUrl,
    serverPort: env.serverPort,
    serverTimeout: env.serverTimeout,
    corsOrigins: env.corsOrigins,
    storeBasePath: env.storeBasePath,
    logLevel: env.logLevel
});

// Add CORS middleware first
app.use(cors({
    origin: (ctx) => {
        const allowedOrigins = env.corsOrigins;
        const origin = ctx.request.header.origin;
        if (allowedOrigins.includes(origin)) {
            return origin;
        }
        return allowedOrigins[0];
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Add body parser middleware
app.use(bodyParser());

// Global error handling middleware
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        // Log error and set appropriate response
        console.error('Server error:', err);
        ctx.status = err.status || 500;
        ctx.body = {
            message: 'Internal server error',
            // Only show detailed error in non-production environments
            error: process.env.NODE_ENV === 'production' ? undefined : err.message
        };

        // Ensure CORS headers are set even in error responses
        ctx.set('Access-Control-Allow-Origin', ctx.request.header.origin || env.corsOrigins[0]);
        ctx.set('Access-Control-Allow-Credentials', 'true');
    }
});

// Configure routing
app.use(router.routes());
app.use(router.allowedMethods());

// Start the server
let server: Server;
try {
    if (currentEnv === 'local') {
        await killPortProcess(env.serverPort);
    }

    server = app.listen(env.serverPort);

    server.on('error', (err) => {
        console.error('Server startup error:', err);
        process.exit(1);
    });

    server.on('listening', () => {
        console.log(`Server now listening on port ${env.serverPort}`);
    });
} catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
}

// Global server error handler
server.on('error', (err) => {
    console.error('Server startup error:', err);
    process.exit(1); // Exit on critical errors
});

// Handle process termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

async function killPortProcess(port: number): Promise<void> {
    try {
        console.log(`Attempting to kill process on port ${port}...`);
        const { stdout } = await execAsync(`lsof -i :${port} -t`);
        if (stdout) {
            const pid = stdout.trim();
            await execAsync(`kill -9 ${pid}`);
            console.log(`Killed process ${pid} on port ${port}`);
            // Increased wait time
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (error) {
        console.log(`Error checking/killing process on port ${port}:`, error.message);
    }
}

// Export the app instance for testing/importing
export default app;