import { issuestoString, LanguageRegistry, LionWebJsonChunk, LionWebValidator } from "@lionweb/validation";
import { IRouterContext } from "koa-router";
import * as path from "node:path";
import { StorageFactory } from '../storage/storage-factory.js';

const storage = StorageFactory.getStorageHandler();

export class ModelHandler {

    public static validate = false;
    static rootpath = "studies";

    private static getModelPath(model: string): string {
        return path.join(this.rootpath, model);
    }

    public static async getModelList(ctx: IRouterContext) {
        try {
            const studiesPath = 'studies';
            if (!await storage.directoryExists(studiesPath)) {
                await storage.ensureDirectory(studiesPath);
            }
            const models = await storage.listDirectories(studiesPath);
            ctx.status = 200;
            ctx.response.type = 'application/json';
            ctx.response.body = models;
        } catch (e) {
            console.log(String(e));
            ctx.status = 500;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Error getting model list" };
        }
    }

    public static async deleteModel(model: string, ctx: IRouterContext) {
        try {
            const modelPath = this.getModelPath(model);
            // Delete all files in the directory first
            const units = await storage.listFiles(modelPath);
            for (const unit of units) {
                await storage.deleteFile(path.join(modelPath, unit));
            }
            // Now delete the directory itself
            await storage.deleteDirectory(modelPath);
            ctx.status = 200;
            ctx.response.body = { message: "Model deleted successfully" };
        } catch (e) {
            console.log(String(e));
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting model" };
        }
    }

    public static async getModelUnitList(model: string, ctx: IRouterContext) {
        try {
            const modelPath = this.getModelPath(model);
            console.log("ModelHandler.getModelUnitList: modelPath=", modelPath);

            // Ensure directory exists
            if (!await storage.directoryExists(modelPath)) {
                console.log("ModelHandler.getModelUnitList: directory does not exist, creating");
                await storage.ensureDirectory(modelPath);
            }

            // Get list of units
            const files = await storage.listFiles(modelPath);
            const units = files.map(file => file.substring(0, file.length - 5));

            // Set response
            ctx.status = 200;
            ctx.response.type = 'application/json';
            ctx.response.body = units;
            console.log("ModelHandler.getModelUnitList: list:", ctx.response.body);

        } catch (e) {
            console.error("ModelHandler.getModelUnitList: error occurred:", e);
            ctx.status = 500;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Error getting unit list" };
        }
    }

    public static async getModelUnit(model: string, unit: string, ctx: IRouterContext) {
        try {
            const filePath = path.join(this.getModelPath(model), `${unit}.json`);
            console.log("ModelHandler.getModelUnit: " + filePath);

            const content = await storage.readFile(filePath);

            if (ModelHandler.validate) {
                const jsonObject = JSON.parse(content);
                const chunk = jsonObject as LionWebJsonChunk;
                const validator = new LionWebValidator(chunk, new LanguageRegistry());
                validator.validateSyntax();
                if (validator.validationResult.hasErrors()) {
                    console.error(issuestoString(validator.validationResult, name + ": lionweb-deserialize-syntax"));
                }
                validator.validateReferences();
                if (validator.validationResult.hasErrors()) {
                    console.error(issuestoString(validator.validationResult, name + ": lionweb-deserialize-references"));
                }
            }
            ctx.status = 200;
            ctx.response.type = 'application/json';
            ctx.response.body = content;
        } catch (e) {
            console.log(String(e));
            ctx.status = 500;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Error getting model unit" };
        }
    }

    public static async saveModelUnit(model: string, unit: string, ctx: IRouterContext) {
        try {
            const modelPath = this.getModelPath(model);
            // Ensure directory exists (creates model directory if it doesn't exist)
            if (!await storage.directoryExists(modelPath)) {
                await storage.ensureDirectory(modelPath);
            }
            const filePath = path.join(modelPath, `${unit}.json`);
            await storage.writeFile(filePath, JSON.stringify(ctx.request.body, null, 3));
        } catch (e) {
            console.log(String(e));
        }
    }

    public static async deleteModelUnit(model: string, unit: string, ctx: IRouterContext) {
        try {
            const filePath = path.join(this.getModelPath(model), `${unit}.json`);
            await storage.deleteFile(filePath);
        } catch (e) {
            console.log(String(e));
            ctx.request.body = String(e);
        }
    }

}
