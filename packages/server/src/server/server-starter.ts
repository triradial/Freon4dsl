import { app } from "./server-def.js";
import { config } from "./config.js";
import Router from 'koa-router';

const router = new Router({
    prefix: '' // Ensure no prefix is set
});

// Add CORS headers middleware
app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (ctx.method === 'OPTIONS') {
        ctx.status = 200;
        return;
    }
    
    await next();
});

// Add request logging
app.use(async (ctx, next) => {
    const start = Date.now();
    console.log(`${ctx.method} ${ctx.url} - Request received`);
    try {
        await next();
        const ms = Date.now() - start;
        console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
    } catch (err) {
        console.error(`${ctx.method} ${ctx.url} - Error:`, err);
        throw err;
    }
});

router.get('/health', async (ctx) => {
    ctx.status = 200;
    ctx.body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        port: process.env.PORT || config.port
    };
});

router.get('/', async (ctx) => {
    ctx.status = 200;
    ctx.body = "Freon Model Server";
});

// Mount routes BEFORE other middleware
app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || config.port;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Routes registered:', 
        router.stack.map(layer => ({
            path: layer.path,
            methods: layer.methods
        }))
    );
});

export default app;