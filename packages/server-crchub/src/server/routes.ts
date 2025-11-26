import Router from "koa-router";
import { RateLimit } from 'koa2-ratelimit';

import { ModelHandler } from "./model-handler.js";
import { DataHandler } from "./data-handler.js";
import { AuthHandler } from "./auth-handler.js";

import { z } from 'zod';

const router = new Router();

const rateLimiter = RateLimit.middleware({
    interval: { min: 15 }, // 15 minutes
    max: 5, // 5 requests per interval
    message: 'Too many login attempts, please try again later',
    prefixKey: 'login' // to separate login attempts from other rate limits
});

const signInSchema = z.object({
    username: z.string().email(),
    password: z.string().min(1)
});

/* ------------------------------------------------------------ */
// General requests
/* ------------------------------------------------------------ */
router.get('/', async (ctx: Router.IRouterContext) => {
    ctx.body = 'CRCHub Server';
});

router.get('/health', async (ctx: Router.IRouterContext) => {
    ctx.body = { status: 'ok' };
});

/* ------------------------------------------------------------ */
// Auth requests
/* ------------------------------------------------------------ */
router.post('/signIn', rateLimiter, async (ctx: Router.IRouterContext) => {
    try {
        console.log('Router.signIn: ctx.request.body=', JSON.stringify(ctx.request.body, null, 2));
        const { username, password } = signInSchema.parse(ctx.request.body);
        console.log('Router.signIn: ' + username);
        await AuthHandler.signIn(username, password, ctx);
    } catch (error) {
        console.error('SignIn error:', error);
        ctx.status = 500;
        ctx.body = { error: 'Authentication failed', details: error + ' ' + JSON.stringify(ctx.request.body, null, 2) };
    }
});

router.post('/signOut', async (ctx: Router.IRouterContext) => {
    try {
        console.log('Router.signOut');
        await AuthHandler.signOut(ctx);
    } catch (error) {
        console.error('SignOut error:', error);
        ctx.status = 500;
        ctx.body = { error: 'SignOut failed' };
    }
});

/* ------------------------------------------------------------ */
// Model requests
/* ------------------------------------------------------------ */
router.get("/getModelList", async (ctx: Router.IRouterContext) => {
    console.log("Routes.getModelList");
    await ModelHandler.getModelList(ctx);
});

router.get("/deleteModel", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    console.log("Routes.deleteModel: " + model);
    if (!!model && typeof model === "string") {
        await ModelHandler.deleteModel(model, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'folder'" };
    }
    ctx.body = { massage: (ctx.request as any).body };
});

router.get("/getModelUnit", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    const unit = ctx.query["unit"];
    console.log("Routes.getModelUnit: model=" + model + " unit=" + unit);
    if ((!!unit || model) && typeof unit === "string" && typeof model === "string") {
        console.log("Routes.getModelUnit: calling ModelRequests.getModelUnit");
        await ModelHandler.getModelUnit(model, unit, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'model' or 'unit'" };
    }
});

router.get("/getModelUnitList", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    console.log("Routes.getModelUnitList: model=" + model);
    if (!!model && typeof model === "string") {
        await ModelHandler.getModelUnitList(model, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'model'" };
    }
});

router.get("/getUnitList", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    console.log("Routes.getUnitList: model=" + model);
    if (!!model && typeof model === "string") {
        await ModelHandler.getModelUnitList(model, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'model'" };
    }
});

router.put("/saveModelUnit", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    const unit = ctx.query["unit"];
    console.log("Routes.saveModelUnit: " + model + "/" + unit);
    if ((!!unit || !!model) && typeof unit === "string" && typeof model === "string") {
        await ModelHandler.saveModelUnit(model, unit, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'model' or 'unit'" };
    }
    ctx.response.body = { massage: (ctx.request as any).body };
});

router.get("/deleteModelUnit", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    const unit = ctx.query["unit"];
    console.log("Routes.deleteModelUnit: " + model + "/" + unit);
    if ((!!unit || !!model) && typeof unit === "string" && typeof model === "string") {
        await ModelHandler.deleteModelUnit(model, unit, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.message = "Missing query parameter 'model' or 'folder'";
    }
    ctx.response.body = { massage: (ctx.request as any).body };
});

/* ------------------------------------------------------------ */
// Study requests
/* ------------------------------------------------------------ */
router.get("/getStudies", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    console.log("Routes.getStudies: uid:" + uid);
    if (!!uid && typeof uid === "string") {
        await DataHandler.getStudies(uid, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'guid'" };
    }
});

router.get("/getStudy", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("Routes.getStudy: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.getStudy(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id'" };
    }
});

router.post("/addStudy", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    console.log("Routes.addStudy: uid=" + uid);
    if (!!uid && typeof uid === "string") {
        await DataHandler.addStudy(uid, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.put("/updateStudy", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("Routes.updateStudy: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.updateStudy(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.delete("/deleteStudy", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("Routes.deleteStudy: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.deleteStudy(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

/* ------------------------------------------------------------ */
// Patient requests
/* ------------------------------------------------------------ */
router.get("/getPatients", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    console.log("Routes.getPatients: uid=" + uid);
    if (!!uid && typeof uid === "string") {
        await DataHandler.getPatients(uid, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.get("/getPatient", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("Routes.getPatient: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.getPatient(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.get("/getStudyPatients", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("Routes.getStudyPatients: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.getStudyPatients(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.post("/addPatient", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    console.log("Routes.addPatient: uid=" + uid);
    if (!!uid && typeof uid === "string") {
        await DataHandler.addPatient(uid, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.put("/updatePatient", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("Routes.updatePatient: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.updatePatient(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.delete("/deletePatient", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("Routes.deletePatient: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.deletePatient(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

/* ------------------------------------------------------------ */
// User requests
/* ------------------------------------------------------------ */
router.get("/getUsers", async (ctx: Router.IRouterContext) => {
    console.log("Routes.getUsers");
    await DataHandler.getUsers(ctx);
});

router.get("/getUser", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    console.log("Routes.getUser: " + id);
    if (!!id && typeof id === "string") {
        await DataHandler.getUser(id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id'" };
    }
});

router.get("/getUserByEmail", async (ctx: Router.IRouterContext) => {
    const email = ctx.query["email"];
    console.log("Routes.getUserByEmail: " + email);
    if (!!email && typeof email === "string") {
        await DataHandler.getUserByEmail(email, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'email'" };
    }
});

export default router;
