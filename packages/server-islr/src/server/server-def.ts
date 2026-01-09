import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "koa2-cors";

export const app = new Koa();

// Add request logging
app.use(async (ctx, next) => {
    const start = Date.now();
    try {
        await next();
        const ms = Date.now() - start;
        console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
    } catch (err) {
        console.error('Request error:', err);
        throw err;
    }
});

app.use(cors({
    origin: "*"
}));

app.use(bodyParser());