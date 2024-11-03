import { issuestoString, LanguageRegistry, LionWebJsonChunk, LionWebValidator } from "@lionweb/validation";
import { IRouterContext } from "koa-router";
import * as path from "node:path";
import { StorageFactory } from '../storage/StorageFactory.js';

const storage = StorageFactory.getStorageHandler();

export class ModelHandler {

    public static validate = false;

    private static getModelPath(foldername: string): string {
        return path.join('studies', foldername);
    }

    public static async getModelList(ctx: IRouterContext) {
        try {
            const studiesPath = 'studies';
            if (!await storage.directoryExists(studiesPath)) {
                await storage.ensureDirectory(studiesPath);
            }
            const models = await storage.listFiles(studiesPath);
            ctx.status = 200;
            ctx.response.type = 'application/json';
            ctx.response.body = models;
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Error getting model list" };
        }
    }

    public static async deleteModel(foldername: string, ctx: IRouterContext) {
        try {
            const modelPath = this.getModelPath(foldername);
            // Delete all files in the directory first
            const files = await storage.listFiles(modelPath);
            for (const file of files) {
                await storage.deleteFile(path.join(modelPath, file));
            }
            // Note: We might need to add a deleteDirectory method to IStorageHandler
            // For now, the directory might remain empty
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting model" };
        }
    }

    public static async getModelUnitList(foldername: string, ctx: IRouterContext) {
        try {
            const modelPath = this.getModelPath(foldername);

            // Ensure directory exists
            if (!await storage.directoryExists(modelPath)) {
                await storage.ensureDirectory(modelPath);
            }

            // Get list of files and process them
            const files = await storage.listFiles(modelPath);
            const units = files
                .filter(f => f.endsWith('.json'))
                .map(f => f.substring(0, f.length - 5));

            ctx.status = 200;
            ctx.response.type = 'application/json';
            ctx.response.body = units;

        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Error getting unit list" };
        }
    }

    public static async getModelUnit(foldername: string, name: string, ctx: IRouterContext) {
        try {
            const filePath = path.join(this.getModelPath(foldername), `${name}.json`);
            console.log("ModelRequests.getModelUnit: " + filePath);

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
            console.log(e.message);
            ctx.status = 500;
            ctx.response.type = 'application/json';
            ctx.response.body = { error: "Error getting model unit" };
        }
    }

    public static async saveModelUnit(foldername: string, name: string, ctx: IRouterContext) {
        try {
            const modelPath = this.getModelPath(foldername);
            const filePath = path.join(modelPath, `${name}.json`);
            await storage.writeFile(filePath, JSON.stringify(ctx.request.body, null, 3));
        } catch (e) {
            console.log(e.message);
        }
    }

    public static async deleteModelUnit(foldername: string, name: string, ctx: IRouterContext) {
        try {
            const filePath = path.join(this.getModelPath(foldername), `${name}.json`);
            await storage.deleteFile(filePath);
        } catch (e) {
            console.log(e.message);
            ctx.request.body = e.message;
        }
    }

}
