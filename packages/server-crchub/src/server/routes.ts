import Router from "koa-router";
import { RateLimit } from 'koa2-ratelimit';

import { ModelHandler } from "./model-handler.js";
import { DataHandler } from "./data-handler.js";
import { AuthHandler } from "./auth-handler.js";
import { consoleLogInfo, consoleLogError } from "./logging.js";
import * as modelDiagnosticService from '../service/model-diagnostic-service.js';

import { z } from 'zod';

const moduleName = '[routes]';

const router = new Router();

const rateLimiter = RateLimit.middleware({
    interval: { min: 15 }, // 15 minutes
    max: 100, // 5 requests per interval
    message: 'Too many login attempts, please try again later',
    prefixKey: 'login'
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
        consoleLogInfo(moduleName, `SignIn request body: ${JSON.stringify(ctx.request.body, null, 2)}`);
        const { username, password } = signInSchema.parse(ctx.request.body);
        consoleLogInfo(moduleName, `SignIn attempt for: ${username}`);
        await AuthHandler.signIn(username, password, ctx);
    } catch (error) {
        consoleLogError(moduleName, `SignIn error: ${String(error)}`);
        ctx.status = 500;
        ctx.body = { error: 'Authentication failed', details: error + ' ' + JSON.stringify(ctx.request.body, null, 2) };
    }
});

router.post('/signOut', async (ctx: Router.IRouterContext) => {
    try {
        consoleLogInfo(moduleName, 'SignOut request');
        await AuthHandler.signOut(ctx);
    } catch (error) {
        consoleLogError(moduleName, `SignOut error: ${String(error)}`);
        ctx.status = 500;
        ctx.body = { error: 'SignOut failed' };
    }
});

// Azure AD user lookup endpoints
router.get('/getADUserByUsername', async (ctx: Router.IRouterContext) => {
    try {
        const username = ctx.query["username"];
        consoleLogInfo(moduleName, `getADUserByUsername: ${username}`);
        if (!!username && typeof username === "string") {
            await AuthHandler.getADUserByUsername(username, ctx);
        } else {
            ctx.status = 412;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Missing query parameter 'username'" };
        }
    } catch (error) {
        consoleLogError(moduleName, `getADUserByUsername error: ${String(error)}`);
        ctx.status = 500;
        ctx.body = { error: 'Failed to lookup user' };
    }
});

router.get('/getADUserByOID', async (ctx: Router.IRouterContext) => {
    try {
        const oid = ctx.query["oid"];
        consoleLogInfo(moduleName, `getADUserByOID: ${oid}`);
        if (!!oid && typeof oid === "string") {
            await AuthHandler.getADUserByOID(oid, ctx);
        } else {
            ctx.status = 412;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Missing query parameter 'oid'" };
        }
    } catch (error) {
        consoleLogError(moduleName, `getADUserByOID error: ${String(error)}`);
        ctx.status = 500;
        ctx.body = { error: 'Failed to lookup user' };
    }
});

/* ------------------------------------------------------------ */
// Model requests
/* ------------------------------------------------------------ */
router.get("/getModelList", async (ctx: Router.IRouterContext) => {
    consoleLogInfo(moduleName, 'getModelList');
    await ModelHandler.getModelList(ctx);
});

router.get("/deleteModel", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    consoleLogInfo(moduleName, `deleteModel: ${model}`);
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
    consoleLogInfo(moduleName, `getModelUnit: model=${model} unit=${unit}`);
    if ((!!unit || model) && typeof unit === "string" && typeof model === "string") {
        await ModelHandler.getModelUnit(model, unit, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'model' or 'unit'" };
    }
});

router.post("/saveModelUnit", async (ctx: Router.IRouterContext) => {
    consoleLogInfo(moduleName, `✅ POST /saveModelUnit route handler called`);
    try {
        const body: any = (ctx.request as any).body;
        const model = body?.model;
        const unit = body?.unit;
        const content = body?.content;
        
        consoleLogInfo(moduleName, `saveModelUnit POST: model=${model} unit=${unit} hasContent=${!!content}`);
        
        if (!model || !unit || !content) {
            ctx.status = 400;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Missing required fields: model, unit, content" };
            return;
        }
        
        // Parse the content if it's a string
        const data = typeof content === 'string' ? JSON.parse(content) : content;
        
        await ModelHandler.saveModelUnit(model, unit, data, ctx);
    } catch (error) {
        consoleLogError(moduleName, `saveModelUnit POST error: ${String(error)}`);
        ctx.status = 500;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: 'Failed to save model unit', details: String(error) };
    }
});

router.get("/getModelUnitList", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    consoleLogInfo(moduleName, `getModelUnitList: model=${model}`);
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
    consoleLogInfo(moduleName, `getUnitList: model=${model}`);
    if (!!model && typeof model === "string") {
        await ModelHandler.getModelUnitList(model, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'model'" };
    }
});

// saveModel endpoint - called when creating a new model
// In the database-centric approach, this is a no-op since studies are created through /addStudyWithSite
// The model units are saved individually through saveModelUnit
router.put("/saveModel", async (ctx: Router.IRouterContext) => {
    try {
        const model = ctx.query["model"];
        const language = ctx.query["language"];
        const version = ctx.query["version"];
        
        consoleLogInfo(moduleName, `saveModel (PUT): model=${model} language=${language} version=${version}`);
        
        if (!model) {
            ctx.status = 412; // Precondition failed
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Missing required parameter: model" };
            return;
        }
        
        // In the database-centric approach, the study is already created in the database
        // through the /addStudyWithSite endpoint, so this is essentially a no-op
        ctx.status = 200;
        ctx.response.type = 'application/json';
        ctx.response.body = { message: "Model initialized successfully", model, language, version };
    } catch (error) {
        consoleLogError(moduleName, `saveModel (PUT) error: ${String(error)}`);
        ctx.status = 500;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: 'Failed to save model', details: String(error) };
    }
});

router.put("/saveModelUnit", async (ctx: Router.IRouterContext) => {
    try {
        const body: any = (ctx.request as any).body;
        const model = body.model || ctx.query["model"];
        const unit = body.unit || ctx.query["unit"];
        const content = body.content || body;
        
        consoleLogInfo(moduleName, `saveModelUnit (PUT): model=${model} unit=${unit}`);
        
        if (!model || !unit) {
        ctx.status = 412; // Precondition failed
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Missing required fields: model, unit" };
            return;
        }
        
        // Parse the content if it's a string
        const data = typeof content === 'string' ? JSON.parse(content) : content;
        
        await ModelHandler.saveModelUnit(model, unit, data, ctx);
    } catch (error) {
        consoleLogError(moduleName, `saveModelUnit (PUT) error: ${String(error)}`);
        ctx.status = 500;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: 'Failed to save model unit', details: String(error) };
    }
});

router.get("/deleteModelUnit", async (ctx: Router.IRouterContext) => {
    const model = ctx.query["model"];
    const unit = ctx.query["unit"];
    consoleLogInfo(moduleName, `deleteModelUnit: ${model}/${unit}`);
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
    const all = ctx.query["all"] === "true";
    consoleLogInfo(moduleName, `getStudies: uid=${uid}, all=${all}`);
    if (!!uid && typeof uid === "string") {
        await DataHandler.getStudies(uid, ctx, all);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'guid'" };
    }
});

router.get("/getStudy", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `getStudy: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.getStudy(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id'" };
    }
});

router.get("/checkStudyNameExists", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    if (!!uid && typeof uid === "string") {
        await DataHandler.checkStudyNameExists(uid, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = "application/json";
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.post("/addStudy", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `addStudy: uid=${uid}`);
    if (!!uid && typeof uid === "string") {
        await DataHandler.addStudy(uid, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.post("/addStudyWithSite", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `addStudyWithSite: uid=${uid}`);
    if (!!uid && typeof uid === "string") {
        await DataHandler.addStudyWithSite(uid, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.post("/copyStudy", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `copyStudy: uid=${uid}`);
    if (!!uid && typeof uid === "string") {
        await DataHandler.copyStudy(uid, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.put("/updateStudy", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `updateStudy: id=${id} uid=${uid}`);
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
    consoleLogInfo(moduleName, `deleteStudy: id=${id} uid=${uid}`);
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
    consoleLogInfo(moduleName, `getPatients: uid=${uid}`);
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
    consoleLogInfo(moduleName, `getPatient: id=${id} uid=${uid}`);
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
    consoleLogInfo(moduleName, `getStudyPatients: id=${id} uid=${uid}`);
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
    consoleLogInfo(moduleName, `addPatient: uid=${uid}`);
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
    consoleLogInfo(moduleName, `updatePatient: id=${id} uid=${uid}`);
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
    consoleLogInfo(moduleName, `deletePatient: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.deletePatient(uid, id, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.get("/getPatientUnavailableDates", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    consoleLogInfo(moduleName, `getPatientUnavailableDates: id=${id}`);
    if (!!id && typeof id === "string") {
        await DataHandler.getPatientUnavailableDates(id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id'" };
    }
});

router.put("/setPatientUnavailableDates", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    consoleLogInfo(moduleName, `setPatientUnavailableDates: id=${id}`);
    if (!!id && typeof id === "string") {
        await DataHandler.setPatientUnavailableDates(id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id'" };
    }
});

router.get("/getPatientSchedule", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    consoleLogInfo(moduleName, `getPatientSchedule: id=${id}`);
    if (!!id && typeof id === "string") {
        await DataHandler.getPatientSchedule(id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id'" };
    }
});

router.put("/setPatientSchedule", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    consoleLogInfo(moduleName, `setPatientSchedule: id=${id}`);
    if (!!id && typeof id === "string") {
        await DataHandler.setPatientSchedule(id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id'" };
    }
});

router.get("/getStudyPatientsWithSchedules", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    consoleLogInfo(moduleName, `getStudyPatientsWithSchedules: id=${id}`);
    if (!!id && typeof id === "string") {
        await DataHandler.getStudyPatientsWithSchedules(id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id'" };
    }
});

/* ------------------------------------------------------------ */
// User requests
/* ------------------------------------------------------------ */
router.get("/getUsers", async (ctx: Router.IRouterContext) => {
    consoleLogInfo(moduleName, 'getUsers');
    await DataHandler.getUsers(ctx);
});

router.get("/getUser", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    consoleLogInfo(moduleName, `getUser: ${id}`);
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
    consoleLogInfo(moduleName, `getUserByEmail: ${email}`);
    if (!!email && typeof email === "string") {
        await DataHandler.getUserByEmail(email, ctx);
    } else {
        ctx.status = 412; // Precondition failed
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'email'" };
    }
});

/* ------------------------------------------------------------ */
// Organization requests
/* ------------------------------------------------------------ */
router.get("/getOrganizations", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `getOrganizations: uid=${uid}`);
    if (!!uid && typeof uid === "string") {
        await DataHandler.getOrganizations(uid, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.get("/getOrganization", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `getOrganization: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.getOrganization(uid, id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.get("/getUserOrganization", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `getUserOrganization: uid=${uid}`);
    if (!!uid && typeof uid === "string") {
        await DataHandler.getUserOrganization(uid, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.post("/addOrganization", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `addOrganization: uid=${uid}`);
    if (!!uid && typeof uid === "string") {
        await DataHandler.addOrganization(uid, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.put("/updateOrganization", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `updateOrganization: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.updateOrganization(uid, id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.delete("/deleteOrganization", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `deleteOrganization: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.deleteOrganization(uid, id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

/* ------------------------------------------------------------ */
// Person requests
/* ------------------------------------------------------------ */
router.get("/getPersons", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `[getPersons] Route called - uid=${uid}, type=${typeof uid}`);
    if (!!uid && typeof uid === "string") {
        consoleLogInfo(moduleName, `[getPersons] Calling DataHandler.getPersons with uid=${uid}`);
        await DataHandler.getPersons(uid, ctx);
        consoleLogInfo(moduleName, `[getPersons] DataHandler.getPersons completed, status=${ctx.status}`);
    } else {
        consoleLogError(moduleName, `[getPersons] Missing or invalid uid parameter - uid=${uid}, type=${typeof uid}`);
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.get("/getPerson", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `getPerson: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.getPerson(uid, id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.post("/addPerson", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `addPerson: uid=${uid}`);
    if (!!uid && typeof uid === "string") {
        await DataHandler.addPerson(uid, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.put("/updatePerson", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `updatePerson: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.updatePerson(uid, id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.delete("/deletePerson", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `deletePerson: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.deletePerson(uid, id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

/* ------------------------------------------------------------ */
// Lookup data requests
/* ------------------------------------------------------------ */
router.get("/getOrgTypes", async (ctx: Router.IRouterContext) => {
    consoleLogInfo(moduleName, `getOrgTypes`);
    await DataHandler.getOrgTypes(ctx);
});

router.get("/getOrgSubtypes", async (ctx: Router.IRouterContext) => {
    consoleLogInfo(moduleName, `getOrgSubtypes`);
    await DataHandler.getOrgSubtypes(ctx);
});

router.get("/getPersonRoles", async (ctx: Router.IRouterContext) => {
    consoleLogInfo(moduleName, `getPersonRoles`);
    await DataHandler.getPersonRoles(ctx);
});

// Person Unavailable Dates
router.get("/getPersonUnavailableDates", async (ctx: Router.IRouterContext) => {
    try {
        const oid = ctx.query["oid"] as string;
        const personId = ctx.query["personId"] as string;
        const orgId = ctx.query["orgId"] as string;
        
        if (!oid || !personId || !orgId) {
            ctx.status = 400;
            ctx.body = { error: 'Missing required parameters: oid, personId, orgId' };
            return;
        }
        
        consoleLogInfo(moduleName, `getPersonUnavailableDates: personId=${personId}, orgId=${orgId}`);
        await DataHandler.getPersonUnavailableDates(oid, personId, orgId, ctx);
    } catch (error) {
        consoleLogError(moduleName, `getPersonUnavailableDates error: ${String(error)}`);
        ctx.status = 500;
        ctx.body = { error: 'Failed to get person unavailable dates' };
    }
});

router.post("/setPersonUnavailableDates", async (ctx: Router.IRouterContext) => {
    try {
        const oid = ctx.query["oid"] as string;
        const personId = ctx.query["personId"] as string;
        const orgId = ctx.query["orgId"] as string;
        
        if (!oid || !personId || !orgId) {
            ctx.status = 400;
            ctx.body = { error: 'Missing required parameters: oid, personId, orgId' };
            return;
        }
        
        consoleLogInfo(moduleName, `setPersonUnavailableDates: personId=${personId}, orgId=${orgId}`);
        await DataHandler.setPersonUnavailableDates(oid, personId, orgId, ctx);
    } catch (error) {
        consoleLogError(moduleName, `setPersonUnavailableDates error: ${String(error)}`);
        ctx.status = 500;
        ctx.body = { error: 'Failed to set person unavailable dates' };
    }
});

/* ------------------------------------------------------------ */
// Site requests
/* ------------------------------------------------------------ */
router.get("/getSites", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `getSites: uid=${uid}`);
    if (!!uid && typeof uid === "string") {
        await DataHandler.getSites(uid, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.get("/getSite", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `getSite: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.getSite(uid, id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.get("/getStudySites", async (ctx: Router.IRouterContext) => {
    const studyId = ctx.query["studyId"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `getStudySites: studyId=${studyId} uid=${uid}`);
    if (!!studyId && typeof studyId === "string" && !!uid && typeof uid === "string") {
        await DataHandler.getStudySites(uid, studyId, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'studyId' or 'uid'" };
    }
});

router.get("/getOrganizationSites", async (ctx: Router.IRouterContext) => {
    const orgId = ctx.query["orgId"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `getOrganizationSites: orgId=${orgId} uid=${uid}`);
    if (!!orgId && typeof orgId === "string" && !!uid && typeof uid === "string") {
        await DataHandler.getOrganizationSites(uid, orgId, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'orgId' or 'uid'" };
    }
});

router.get("/getUserStudySite", async (ctx: Router.IRouterContext) => {
    const studyId = ctx.query["studyId"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `getUserStudySite: studyId=${studyId} uid=${uid}`);
    if (!!studyId && typeof studyId === "string" && !!uid && typeof uid === "string") {
        await DataHandler.getUserStudySite(uid, studyId, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'studyId' or 'uid'" };
    }
});

router.put("/updateSiteNumber", async (ctx: Router.IRouterContext) => {
    const siteId = ctx.query["siteId"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `updateSiteNumber: siteId=${siteId} uid=${uid}`);
    if (!!siteId && typeof siteId === "string" && !!uid && typeof uid === "string") {
        await DataHandler.updateSiteNumber(uid, siteId, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'siteId' or 'uid'" };
    }
});

router.get("/checkSiteNumberExists", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    if (!!uid && typeof uid === "string") {
        await DataHandler.checkSiteNumberExists(uid, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = "application/json";
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.post("/addSite", async (ctx: Router.IRouterContext) => {
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `addSite: uid=${uid}`);
    if (!!uid && typeof uid === "string") {
        await DataHandler.addSite(uid, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'uid'" };
    }
});

router.put("/updateSite", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `updateSite: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.updateSite(uid, id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

router.delete("/deleteSite", async (ctx: Router.IRouterContext) => {
    const id = ctx.query["id"];
    const uid = ctx.query["uid"];
    consoleLogInfo(moduleName, `deleteSite: id=${id} uid=${uid}`);
    if (!!id && typeof id === "string" && !!uid && typeof uid === "string") {
        await DataHandler.deleteSite(uid, id, ctx);
    } else {
        ctx.status = 412;
        ctx.response.type = 'application/json';
        ctx.response.body = { error: "Missing query parameter 'id' or 'uid'" };
    }
});

/* ------------------------------------------------------------ */
// Model Diagnostic and Repair Endpoints
/* ------------------------------------------------------------ */

router.get("/diagnostics/model-sync", async (ctx: Router.IRouterContext) => {
    consoleLogInfo(moduleName, 'Model sync diagnostics requested');
    try {
        ctx.response.type = 'application/json';
        const results = await modelDiagnosticService.diagnoseModelSync();
        ctx.status = 200;
        ctx.response.body = results;
    } catch (e) {
        consoleLogError(moduleName, `Error running model sync diagnostics: ${String(e)}`);
        ctx.status = 500;
        ctx.response.body = { error: "Error running diagnostics", details: String(e) };
    }
});

router.get("/diagnostics/model-sync/issues", async (ctx: Router.IRouterContext) => {
    consoleLogInfo(moduleName, 'Model sync issues requested');
    try {
        ctx.response.type = 'application/json';
        const results = await modelDiagnosticService.getStudiesWithIssues();
        ctx.status = 200;
        ctx.response.body = results;
    } catch (e) {
        consoleLogError(moduleName, `Error getting model sync issues: ${String(e)}`);
        ctx.status = 500;
        ctx.response.body = { error: "Error getting issues", details: String(e) };
    }
});

router.get("/diagnostics/model-sync/summary", async (ctx: Router.IRouterContext) => {
    consoleLogInfo(moduleName, 'Model sync summary requested');
    try {
        ctx.response.type = 'application/json';
        const summary = await modelDiagnosticService.getModelSyncSummary();
        ctx.status = 200;
        ctx.response.body = summary;
    } catch (e) {
        consoleLogError(moduleName, `Error getting model sync summary: ${String(e)}`);
        ctx.status = 500;
        ctx.response.body = { error: "Error getting summary", details: String(e) };
    }
});

export default router;
