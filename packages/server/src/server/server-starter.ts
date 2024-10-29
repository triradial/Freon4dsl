import { app } from "./server-def.js";
import { config } from "./config.js";
import type { Context } from 'koa';
import Router from 'koa-router';

const router = new Router();

router.get('/health', async (ctx: Context) => {
    ctx.status = 200;
    ctx.body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    };
});

app.listen(config.port);

console.log(`Server running on port ${config.port}`);
