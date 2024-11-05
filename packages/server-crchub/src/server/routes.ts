import Router from "koa-router";

import { ModelHandler } from "./ModelHandler.js";
import { DataHandler } from "./DataHandler.js";

const router = new Router();

// General requests
router.get('/', async (ctx: Router.IRouterContext) => {
    ctx.body = 'CRCHub Server';
});

router.get('/health', async (ctx: Router.IRouterContext) => {
    ctx.body = { status: 'ok' };
});

// Model requests
router.get("/getModelList", async (ctx: Router.IRouterContext) => {
    console.log("router.getModelList");
    await ModelHandler.getModelList(ctx);
});

router.get("/deleteModel", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    console.log("router.deleteModel: " + model);
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
    console.log("router.getModelUnit: model=" + model + " unit=" + unit);
    if ((!!unit || model) && typeof unit === "string" && typeof model === "string") {
        console.log("router.getModelUnit: calling ModelRequests.getModelUnit");
        await ModelHandler.getModelUnit(model, unit, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'model' or 'unit'" };
    }
});

router.get("/getModelUnitList", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    console.log("router.getModelUnitList: model=" + model);
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
    console.log("router.saveModelUnit: " + model + "/" + unit);
    if ((!!unit || !!model) && typeof unit === "string" && typeof model === "string") {
        await ModelHandler.saveModelUnit(model, unit, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'model' or 'unit'" };
    }
    // ModelRequests.generateChart(ctx.request.body);
    ctx.response.body = { massage: (ctx.request as any).body };
});

router.get("/deleteModelUnit", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    const unit = ctx.query["unit"];
    console.log("router.deleteModelUnit: " + model + "/" + unit);
    if ((!!unit || !!model) && typeof unit === "string" && typeof model === "string") {
        await ModelHandler.deleteModelUnit(model, unit, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.message = "Missing query parameter 'model' or 'folder'";
    }
    ctx.response.body = { massage: (ctx.request as any).body };
});

// Study requests
router.get("/getStudies", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    console.log("routes.getStudies: uid:" + uid);
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
    console.log("routes.getStudy: id=" + id + " uid=" + uid);
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
    console.log("routes.addStudy: uid=" + uid);
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
    console.log("routes.updateStudy: id=" + id + " uid=" + uid);
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
    console.log("routes.deleteStudy: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.deleteStudy(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

// Patient requests
router.get("/getPatients", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    console.log("routes.getPatients: uid=" + uid);
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
    console.log("routes.getPatient: id=" + id + " uid=" + uid);
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
    console.log("routes.getStudyPatients: id=" + id + " uid=" + uid);
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
    console.log("routes.addPatient: uid=" + uid);
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
    console.log("routes.updatePatient: id=" + id + " uid=" + uid);
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
    console.log("routes.deletePatient: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.deletePatient(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

// User requests
router.get("/getUsers", async (ctx: Router.IRouterContext) => {
    console.log("routes.getUsers");
    await DataHandler.getUsers(ctx);
});

router.get("/getUser", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    console.log("routes.getUser: " + id);
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
    console.log("routes.getUserByEmail: " + email);
    if (!!email && typeof email === "string") {
        await DataHandler.getUserByEmail(email, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'email'" };
    }
});

export default router;
