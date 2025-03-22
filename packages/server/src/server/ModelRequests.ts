import { issuestoString, LanguageRegistry, LionWebJsonChunk, LionWebValidator } from "@lionweb/validation";
import { IRouterContext } from "koa-router";
import * as path from "node:path";
import { StorageFactory } from '../storage/StorageFactory.js';

const storage = StorageFactory.getStorageHandler();

export class ModelRequests {

    private static storeFolder: string = './modelstore';
    public static validate = false;

    public static async putModelUnit(foldername: string, name: string, ctx: IRouterContext) {
        try {
            const modelPath = path.join(this.storeFolder, foldername);
            const filePath = path.join(modelPath, `${name}.json`);
            await storage.writeFile(filePath, JSON.stringify(ctx.request.body, null, 3));
        } catch (e) {
            console.log(e.message);
        }
    }

    public static async deleteModelUnit(foldername: string, name: string, ctx: IRouterContext) {
        try {
            const filePath = path.join(this.storeFolder, foldername, `${name}.json`);
            await storage.deleteFile(filePath);
        } catch (e) {
            console.log(e.message);
            ctx.request.body = e.message;
        }
    }

    public static async getModelUnit(foldername: string, name: string, ctx: IRouterContext) {
        try {
            console.log("ModelRequests.getModelUnit: storeFolder=" + this.storeFolder);
            const filePath = path.join(this.storeFolder, foldername, `${name}.json`);
            console.log("ModelRequests.getModelUnit: " + filePath);

            const content = await storage.readFile(filePath);

            if (ModelRequests.validate) {
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
            ctx.response.body = content;
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.response.body = { error: "Error getting model unit" };
        }
    }

    public static async getUnitList(foldername: string, ctx: IRouterContext) {
        try {
            const modelPath = path.join(this.storeFolder, foldername);

            // Ensure directory exists
            if (!await storage.directoryExists(modelPath)) {
                await storage.ensureDirectory(modelPath);
            }

            // Get list of files and process them
            const files = await storage.listFiles(modelPath);
            const units = files
                .filter(f => f.endsWith('.json'))
                .map(f => f.substring(0, f.length - 5));

            // FIXME A hack to return a specific unit as the first, only for Education demo!!
            const fractionIndex = units.findIndex(s => s === "Fractions10");
            if (fractionIndex !== -1) {
                units.splice(fractionIndex, 1);
                units.splice(0, 0, "Fractions10");
            }
            // FIXME End
            ctx.status = 200;
            ctx.response.body = units;

        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.response.body = { error: "Error getting unit list" };
        }
    }

    public static async getModelList(ctx: IRouterContext) {
        try {
            if (!await storage.directoryExists(this.storeFolder)) {
                await storage.ensureDirectory(this.storeFolder);
            }
            const models = await storage.listFiles(this.storeFolder);
            ctx.status = 200;
            ctx.response.body = models;
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.response.body = { error: "Error getting model list" };
        }
    }

    public static async deleteModel(foldername: string, ctx: IRouterContext) {
        try {
            const modelPath = path.join(this.storeFolder, foldername);
            // Note: You may need to add a deleteDirectory method to your storage interface
            // For now, this will need to be handled differently depending on your storage implementation
            await storage.deleteFile(modelPath);
        } catch (e) {
            console.log(e.message);
            ctx.status = 500;
            ctx.response.body = { error: "Error deleting model" };
        }
    }

}
