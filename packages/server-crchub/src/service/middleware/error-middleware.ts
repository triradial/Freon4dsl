import { Context, Next } from 'koa';
import { environments, type Environment } from '../../config/environments.js';
import { consoleLogError } from '../../server/logging.js';

const moduleName = '[Error-Middleware]';

// Define standard error types
export class AppError extends Error {
    status: number;
    details?: Record<string, any>;

    constructor(message: string, status: number = 500, details?: Record<string, any>) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.details = details;
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, 400, details);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, 401, details);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 402, details);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, 404, details);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string, details?: Record<string, any>) {
        super(message, 403, details);
    }
}

// Error handler middleware
export async function errorMiddleware(ctx: Context, next: Next) {
    const action = moduleName + ' errorMiddleware';
    try {
        await next();
    } catch (err: any) {
        consoleLogError(action, 'Error caught: ' + JSON.stringify({
            path: ctx.path,
            method: ctx.method,
            url: ctx.url,
            error: err?.message || String(err),
            stack: err?.stack,
            errorType: err?.constructor?.name,
            errorDetails: err?.details || {}
        }));

        // Get environment configuration
        const currentEnv = (process.env.AZURE_ENVIRONMENT || 'local') as Environment;
        const env = environments[currentEnv];
        const isLocal = currentEnv === 'local';

        // Always set CORS headers in the same way as the main middleware
        const requestOrigin = ctx.request.header.origin;
        const allowedOrigins = env.corsOrigins;

        if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
            ctx.set('Access-Control-Allow-Origin', requestOrigin);
        } else {
            ctx.set('Access-Control-Allow-Origin', allowedOrigins[0]);
        }
        
        // Essential CORS headers
        ctx.set('Access-Control-Allow-Credentials', 'true');
        ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
        ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Service-Api-Key, Accept');
        ctx.set('Access-Control-Max-Age', '86400'); // 24 hours
        ctx.set('Access-Control-Expose-Headers', 'Content-Length, Content-Type');

        // Set error response
        ctx.status = err?.status || 500;
        ctx.body = {
            error: {
                message: err?.message || 'Internal Server Error',
                status: ctx.status,
                ...(isLocal && { stack: err?.stack })
            }
        };

        // Emit error for global handling
        ctx.app.emit('error', err, ctx);
    }
} 
