import { app } from "./server-def.js";
import { config } from "./config.js";
import type { Context } from 'koa';
import Router from 'koa-router';

const router = new Router();

// Add multiple route handlers to catch both paths
router.get('/health', healthCheck);
router.get('/server/health', healthCheck);

// Separate the handler function for reusability
async function healthCheck(ctx: Context) {
    try {
        ctx.status = 200;
        ctx.body = {
            status: 'ok',
            timestamp: new Date().toISOString()
        };
        console.log('Health check accessed:', ctx.path); // Add logging
    } catch (error) {
        console.error('Health check error:', error);
        ctx.status = 500;
        ctx.body = { error: 'Internal server error' };
    }
}

// Make sure these are in the correct order
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(config.port);

console.log(`Server running on port ${config.port}`);
