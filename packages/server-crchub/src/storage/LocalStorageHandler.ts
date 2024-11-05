import * as fs from "fs/promises";
import { stat, access } from "fs/promises";
import path from 'path';
import { IStorageHandler } from './IStorageHandler.js';

export class LocalStorageHandler implements IStorageHandler {
    private basePath: string;

    constructor() {
        this.basePath = process.env.LOCAL_STORAGE_BASE_PATH ?? './datastore';
    }

    private getFullPath(filePath: string): string {
        return path.join(this.basePath, filePath);
    }

    async readFile(filePath: string): Promise<string> {
        try {
            const fullPath = this.getFullPath(filePath);
            const content = await fs.readFile(fullPath, 'utf8');
            return content;
        } catch (error) {
            throw new Error(`Error reading file ${filePath}: ${error.message}`);
        }
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        try {
            const fullPath = this.getFullPath(filePath);
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(filePath, content);
        } catch (error) {
            throw new Error(`Error writing file ${filePath}: ${error.message}`);
        }
    }

    async deleteFile(filePath: string): Promise<void> {
        try {
            const fullPath = this.getFullPath(filePath);
            await fs.unlink(fullPath);
        } catch (error) {
            throw new Error(`Error deleting file ${filePath}: ${error.message}`);
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
        try {
            const fullPath = this.getFullPath(dirPath);
            return await fs.readdir(fullPath);
        } catch (error) {
            throw new Error(`Error listing files in directory ${dirPath}: ${error.message}`);
        }
    }

    async listDirectories(dirPath: string): Promise<string[]> {
        try {
            const fullPath = this.getFullPath(dirPath);
            return await fs.readdir(fullPath);
        } catch (error) {
            throw new Error(`Error listing directories in directory ${dirPath}: ${error.message}`);
        }
    }

    async ensureDirectory(dirPath: string): Promise<void> {
        try {
            const fullPath = this.getFullPath(dirPath);
            await fs.mkdir(fullPath, { recursive: true });
        } catch (error) {
            throw new Error(`Error creating directory ${dirPath}: ${error.message}`);
        }
    }

    async directoryExists(dirPath: string): Promise<boolean> {
        try {
            const fullPath = this.getFullPath(dirPath);
            const stats = await stat(fullPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }
}