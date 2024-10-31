import Koa from 'koa';
import Router from 'koa-router';
import router from './routes.js';

const app = new Koa();


// Add error handling middleware
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        console.error('Server error:', err);
        ctx.status = err.status || 500;
        ctx.body = {
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'production' ? undefined : err.message
        };
    }
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

// Handle server errors
server.on('error', (err) => {
    console.error('Server startup error:', err);
});

export default app;