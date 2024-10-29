import { app } from "./server-def.js";
import { config } from "./config.js";
import Router from 'koa-router';  // Using koa-router instead of @koa/router

const router = new Router();

// Add health check route before other routes
router.get('/health', async (ctx) => {
    try {
        ctx.status = 200;
        ctx.body = {
            status: 'ok',
            timestamp: new Date().toISOString()
        };
        console.log('Health check accessed:', ctx.path);
    } catch (error) {
        console.error('Health check error:', error);
        ctx.status = 500;
        ctx.body = { error: 'Internal server error' };
    }
});

// Add a root route handler
router.get('/', async (ctx) => {
    ctx.body = "Freon Model Server";
    ctx.status = 200;
});

// Make sure routes are mounted
app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || config.port;
app.listen(port);
console.log(`Server running on port ${port}`);