import { Context, Next } from 'koa';
import { consoleLogError, consoleLogInfo } from '../../server/logging.js';

const moduleName = '[Service-Auth-Middleware]';

export async function serviceAuthMiddleware(ctx: Context, next: Next) {
    const action = moduleName + ' serviceAuthMiddleware';
    try {
        const apiKey = ctx.headers['x-service-api-key'];
        const expectedApiKey = process.env.SERVICE_API_KEY;

        if (expectedApiKey && apiKey !== expectedApiKey) {
            consoleLogError(action, 'Invalid service API key');
            ctx.status = 401;
            ctx.body = { error: 'Unauthorized - Invalid service API key' };
            return;
        }

        consoleLogInfo(action, `Service auth successful for ${ctx.method} ${ctx.path}`);
        await next();
    } catch (ex: any) {
        consoleLogError(action, 'Service auth middleware error: ' + (ex?.message || String(ex)));
        ctx.status = 500;
        ctx.body = { error: 'Service authentication error' };
    }
}
