import Koa from "koa";
import bodyParser from "koa-bodyparser";
import cors from "koa2-cors";
import { consoleLogInfo, consoleLogError } from "./logging.js";

const moduleName = '[server-def]';

export const app = new Koa();

// Add request logging
app.use(async (ctx, next) => {
    const start = Date.now();
    try {
        await next();
        const ms = Date.now() - start;
        consoleLogInfo(moduleName, `${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
    } catch (err) {
        consoleLogError(moduleName, `Request error: ${String(err)}`);
        throw err;
    }
});

app.use(cors({
    origin: "*"
}));

app.use(bodyParser());