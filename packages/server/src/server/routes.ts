import Router from "koa-router";

import { ModelRequests } from "./ModelRequests.js";
import { DataHandler } from "./DataHandler.js";

const router = new Router();

router.get("/", async (ctx: Router.IRouterContext) => {
    ctx.body = "Freon Model Server";
});

// Model requests
router.get("/getModelUnit", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    const name = ctx.query["name"];
    console.log("GetModelUnit: " + folder + "/" + name);
    if ((!!name || folder) && typeof name === "string" && typeof folder === "string") {
        ModelRequests.getModelUnit(folder, name, ctx);
        ctx.status = 201;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'unitName' or 'folder'";
    }
});

router.get("/getModelList", async (ctx: Router.IRouterContext) => {
    console.log("getModelList");
    ModelRequests.getModelList(ctx);
    ctx.status = 201;
});

router.get("/getUnitList", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    // const subfolder = ctx.query["subfolder"];
    console.log("getUnitList: " + folder);
    if (!!folder && typeof folder === "string") {
        ModelRequests.getUnitList(folder, ctx);
        ctx.status = 201;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'folder'";
    }
});

router.put("/putModelUnit", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    const name = ctx.query["name"];
    console.log("PutModel: " + folder + "/" + name);
    if ((!!name || !!folder) && typeof name === "string" && typeof folder === "string") {
        ModelRequests.putModelUnit(folder, name, ctx);
        ctx.status = 201;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'unitName' or 'folder'";
    }
    // ModelRequests.generateChart(ctx.request.body);
    ctx.body = { massage: (ctx.request as any).body };
});

router.get("/deleteModelUnit", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    const name = ctx.query["name"];
    console.log("DeleteModelUnit: " + folder + "/" + name);
    if ((!!name || !!folder) && typeof name === "string" && typeof folder === "string") {
        ModelRequests.deleteModelUnit(folder, name, ctx);
        ctx.status = 201;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'unitName' or 'folder'";
    }
    ctx.body = { massage: (ctx.request as any).body };
});

router.get("/deleteModel", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    console.log("DeleteModel: " + folder);
    if (!!folder && typeof folder === "string") {
        ModelRequests.deleteModel(folder, ctx);
        ctx.status = 201;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'folder'";
    }
    ctx.body = { massage: (ctx.request as any).body };
});

router.get("/printModelUnit", async (ctx: Router.IRouterContext) => {
    const folder = ctx.query["folder"];
    const name = ctx.query["name"];
    console.log("printModel: " + folder + "/" + name);
    if ((!!name || folder) && typeof name === "string" && typeof folder === "string") {
        ModelRequests.printModelUnit(folder, name, ctx);
        ctx.status = 201;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'unitName' or 'folder'";
    }
});

// Study requests
router.get("/getStudies", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    console.log("getStudies: uid:" + uid);
    if (!!uid && typeof uid === "string") {
        DataHandler.getStudies(uid, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'guid'";
    }
});

router.get("/getStudy", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("getStudy: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        DataHandler.getStudy(uid, id, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'id'";
    }
});

router.post("/addStudy", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    console.log("addStudy: uid=" + uid);
    if (!!uid && typeof uid === "string") {
        DataHandler.addStudy(uid, ctx);
        ctx.status = 201;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'uid'";
    }
});

router.put("/updateStudy", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("updateStudy: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        DataHandler.updateStudy(uid, id, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'id' or 'uid'";
    }
});

router.delete("/deleteStudy", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("deleteStudy: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        DataHandler.deleteStudy(uid, id, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'id' or 'uid'";
    }
});

// Patient requests
router.get("/getPatients", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    console.log("getPatients: uid=" + uid);
    if (!!uid && typeof uid === "string") {
        DataHandler.getPatients(uid, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'uid'";
    }
});

router.get("/getPatient", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("getPatient: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        DataHandler.getPatient(uid, id, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'id' or 'uid'";
    }
});

router.get("/getStudyPatients", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("getStudyPatients: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        DataHandler.getStudyPatients(uid, id, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'id' or 'uid'";
    }
});

router.post("/addPatient", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    console.log("addPatient: uid=" + uid);
    if (!!uid && typeof uid === "string") {
        DataHandler.addPatient(uid, ctx);
        ctx.status = 201;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'uid'";
    }
});

router.put("/updatePatient", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("updatePatient: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        DataHandler.updatePatient(uid, id, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'id' or 'uid'";
    }
});

router.delete("/deletePatient", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    console.log("deletePatient: id=" + id + " uid=" + uid);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        DataHandler.deletePatient(uid, id, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'id' or 'uid'";
    }
});

// User requests
router.get("/getUsers", async (ctx: Router.IRouterContext) => {
    console.log("getUsers");
    DataHandler.getUsers(ctx);
    ctx.status = 200;
});

router.get("/getUser", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    console.log("getUser: " + id);
    if (!!id && typeof id === "string") {
        DataHandler.getUser(id, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'id'";
    }
});

router.get("/getUserByEmail", async (ctx: Router.IRouterContext) => {
    const email = ctx.query["email"];
    console.log("getUserByEmail: " + email);
    if (!!email && typeof email === "string") {
        DataHandler.getUserByEmail(email, ctx);
        ctx.status = 200;
    } else {
        ctx.status = 412; // Precondition failed
        ctx.message = "Missing query parameter 'email'";
    }
});

export const routes = router.routes();
