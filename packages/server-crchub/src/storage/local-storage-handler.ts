import * as fs from "fs/promises";
import { stat, access } from "fs/promises";
import path from 'path';
import { IStorageHandler } from './istorage-handler.js';

export class LocalStorageHandler implements IStorageHandler {
    private basePath: string;

    constructor() {
        this.basePath = process.env.LOCAL_STORAGE_BASE_PATH ?? './datastore';
    }

    private getFullPath(filePath: string): string {
        return path.join(this.basePath, filePath);
    }

    async readFile(filePath: string): Promise<string> {
        const fullPath = this.getFullPath(filePath);
        try {
            const content = await fs.readFile(fullPath, 'utf8');
            return content;
        } catch (error) {
            throw new Error(`LocalStorageHandler.readFile: Error reading file ${fullPath}: ${error.message}`);
        }
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        const fullPath = this.getFullPath(filePath);
        try {
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content);
        } catch (error) {
            throw new Error(`LocalStorageHandler.writeFile: Error writing file ${fullPath}: ${error.message}`);
        }
    }

    async deleteFile(filePath: string): Promise<void> {
        const fullPath = this.getFullPath(filePath);
        try {
            await fs.unlink(fullPath);
        } catch (error) {
            throw new Error(`Error deleting file ${fullPath}: ${error.message}`);
        }
    }

    async fileExists(filePath: string): Promise<boolean> {
        try {
            const fullPath = this.getFullPath(filePath);
            await access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    async listFiles(dirPath: string): Promise<string[]> {
        const fullPath = this.getFullPath(dirPath);
        try {
            return await fs.readdir(fullPath);
        } catch (error) {
            throw new Error(`Error listing files in directory ${fullPath}: ${error.message}`);
        }
    }

    async listDirectories(dirPath: string): Promise<string[]> {
        const fullPath = this.getFullPath(dirPath);
        try {
            return await fs.readdir(fullPath);
        } catch (error) {
            throw new Error(`Error listing directories in directory ${fullPath}: ${error.message}`);
        }
    }

    async ensureDirectory(dirPath: string): Promise<void> {
        const fullPath = this.getFullPath(dirPath);
        try {
            await fs.mkdir(fullPath, { recursive: true });
        } catch (error) {
            throw new Error(`Error creating directory ${fullPath}: ${error.message}`);
        }
    }

    async directoryExists(dirPath: string): Promise<boolean> {
        const fullPath = this.getFullPath(dirPath);
        try {
            const stats = await stat(fullPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }
}