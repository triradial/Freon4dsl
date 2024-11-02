import * as fs from "fs/promises";
import { stat, access } from "fs/promises";
import path from 'path';
import { IStorageHandler } from './IStorageHandler.js';

export class LocalStorageHandler implements IStorageHandler {

    async readFile(filePath: string): Promise<string> {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return content;
        } catch (error) {
            throw new Error(`Error reading file ${filePath}: ${error.message}`);
        }
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        try {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, content);
        } catch (error) {
            throw new Error(`Error writing file ${filePath}: ${error.message}`);
        }
    }

    async deleteFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            throw new Error(`Error deleting file ${filePath}: ${error.message}`);
        }
    }

    async fileExists(filePath: string): Promise<boolean> {
        try {
            await access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async listFiles(dirPath: string): Promise<string[]> {
        try {
            return await fs.readdir(dirPath);
        } catch (error) {
            throw new Error(`Error listing files in directory ${dirPath}: ${error.message}`);
        }
    }

    async ensureDirectory(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            throw new Error(`Error creating directory ${dirPath}: ${error.message}`);
        }
    }

    async directoryExists(dirPath: string): Promise<boolean> {
        try {
            const stats = await stat(dirPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }
}