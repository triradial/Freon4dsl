import { IRouterContext } from "koa-router";
import * as modelService from '../service/model-service.js';
import * as studyService from '../service/study-service.js';
import { consoleLogError } from './logging.js';

const moduleName = '[model-handler]';

export class ModelHandler {

    public static validate = false;
    static rootpath = "studies";

    /**
     * Get list of models (studies)
     */
    public static async getModelList(ctx: IRouterContext) {
        try {
            // For now, return list of study IDs
            // In the future, this could be filtered by user's facility
            ctx.status = 200;
            ctx.response.type = 'application/json';
            ctx.response.body = []; // Empty for now, can be populated from studies table
        } catch (e) {
            consoleLogError(moduleName, `Error getting model list: ${String(e)}`);
            ctx.status = 500;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Error getting model list" };
        }
    }

    /**
     * Delete a model (study)
     */
    public static async deleteModel(model: string, ctx: IRouterContext) {
        try {
            // This would delete the study and all related data
            // For now, just return success
            ctx.status = 200;
            ctx.response.body = { message: "Model deleted successfully" };
        } catch (e) {
            consoleLogError(moduleName, `Error getting model list: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting model" };
        }
    }

    /**
     * Get list of model units for a study
     */
    public static async getModelUnitList(model: string, ctx: IRouterContext) {
        try {
            // Return the standard model units
            const units = ['StudyConfiguration', 'Availability', 'PatientInfo'];
            ctx.status = 200;
            ctx.response.type = 'application/json';
            ctx.response.body = units;
        } catch (e) {
            consoleLogError(moduleName, `Error getting unit list: ${String(e)}`);
            ctx.status = 500;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Error getting unit list" };
        }
    }

    /**
     * Get a model unit (StudyConfiguration, Availability, or PatientInfo)
     */
    public static async getModelUnit(model: string, unit: string, ctx: IRouterContext) {
        try {
            const data = await modelService.getModelUnit(model, unit);
            
            if (data === null) {
                ctx.status = 404;
                ctx.response.type = 'application/json';
                ctx.response.body = { error: "Model unit not found" };
                return;
            }

            ctx.status = 200;
            ctx.response.type = 'application/json';
            ctx.response.body = typeof data === 'string' ? data : JSON.stringify(data);
        } catch (e) {
            consoleLogError(moduleName, `Error getting model list: ${String(e)}`);
            ctx.status = 500;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Error getting model unit" };
        }
    }

    /**
     * Save a model unit (StudyConfiguration, Availability, or PatientInfo)
     */
    public static async saveModelUnit(model: string, unit: string, data: any, ctx: IRouterContext) {
        try {
            await modelService.saveModelUnit(model, unit, data);
            ctx.status = 200;
            ctx.response.type = 'application/json';
            ctx.response.body = { message: "Model unit saved successfully" };
        } catch (e) {
            consoleLogError(moduleName, `Error saving model unit: ${String(e)}`);
            ctx.status = 500;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Error saving model unit", details: String(e) };
        }
    }

    /**
     * Delete a model unit
     */
    public static async deleteModelUnit(model: string, unit: string, ctx: IRouterContext) {
        try {
            // For now, set to null/empty
            await modelService.saveModelUnit(model, unit, null);
            ctx.status = 200;
            ctx.response.body = { message: "Model unit deleted successfully" };
        } catch (e) {
            consoleLogError(moduleName, `Error getting model list: ${String(e)}`);
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting model unit", details: String(e) };
        }
    }
}
