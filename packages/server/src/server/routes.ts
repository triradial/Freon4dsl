import Router from "koa-router";

import { ModelRequests } from "./ModelRequests.js";
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
router.get("/getModelUnit", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    const name = ctx.query["name"];
    console.log("router.getModelUnit: " + folder + "/" + name);
    if ((!!name || folder) && typeof name === "string" && typeof folder === "string") {
        console.log("router.getModelUnit: calling ModelRequests.getModelUnit");
        await ModelRequests.getModelUnit(folder, name, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'unitName' or 'folder'" };
    }
});

router.get("/getModelList", async (ctx: Router.IRouterContext) => {
    console.log("getModelList");
    await ModelRequests.getModelList(ctx);
});

router.get("/getUnitList", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    // const subfolder = ctx.query["subfolder"];
    console.log("getUnitList: " + folder);
    if (!!folder && typeof folder === "string") {
        await ModelRequests.getUnitList(folder, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.body = { error: "Missing query parameter 'folder'" };
    }
});

router.put("/putModelUnit", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    const name = ctx.query["name"];
    console.log("PutModel: " + folder + "/" + name);
    if ((!!name || !!folder) && typeof name === "string" && typeof folder === "string") {
        await ModelRequests.putModelUnit(folder, name, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.body = { error: "Missing query parameter 'unitName' or 'folder'" };
    }
    // ModelRequests.generateChart(ctx.request.body);
    ctx.response.body = { massage: (ctx.request as any).body };
});

router.get("/deleteModelUnit", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    const name = ctx.query["name"];
    console.log("DeleteModelUnit: " + folder + "/" + name);
    if ((!!name || !!folder) && typeof name === "string" && typeof folder === "string") {
        await ModelRequests.deleteModelUnit(folder, name, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'unitName' or 'folder'";
    }
    ctx.response.body = { massage: (ctx.request as any).body };
});

router.get("/deleteModel", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    console.log("DeleteModel: " + folder);
    if (!!folder && typeof folder === "string") {
        await ModelRequests.deleteModel(folder, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.body = { error: "Missing query parameter 'folder'" };
    }
    ctx.body = { massage: (ctx.request as any).body };
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
