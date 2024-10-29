import Koa from 'koa';
import Router from 'koa-router';

const app = new Koa();
const router = new Router();

// Basic root route
router.get('/', async (ctx) => {
    ctx.body = 'Freon Model Server';
});

// Health check route
router.get('/health', async (ctx) => {
    ctx.body = { status: 'ok' };
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || 8001;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

export default app;