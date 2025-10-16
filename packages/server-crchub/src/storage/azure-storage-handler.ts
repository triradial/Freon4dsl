import { ShareClient, ShareDirectoryClient, ShareServiceClient } from '@azure/storage-file-share';
import { IStorageHandler } from './istorage-handler.js';

export class AzureStorageHandler implements IStorageHandler {

    private shareServiceClient: ShareServiceClient;
    private fileShare: ShareClient;

    constructor() {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const shareName = process.env.AZURE_STORAGE_SHARE_NAME || 'datastore';
        if (!connectionString) {
            throw new Error('Azure Storage connection string not found');
        }
        this.shareServiceClient = ShareServiceClient.fromConnectionString(connectionString);
        this.fileShare = this.shareServiceClient.getShareClient(shareName);
    }

    async readFile(filePath: string): Promise<string> {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        console.log('Azure Storage Read Request:', {
            requestedPath: filePath,
            dirPath,
            fileName,
            fileShare: this.fileShare.name
        });
        const directoryClient = dirPath ? this.getDirectoryClient(dirPath) : this.fileShare.rootDirectoryClient;
        const fileClient = directoryClient.getFileClient(fileName);
        const fileExists = await fileClient.exists();
        if (!fileExists) {
            throw new Error(`File does not exist: ${filePath} (in share: ${this.fileShare.name})`);
        }
        const downloadResponse = await fileClient.downloadToBuffer();
        return downloadResponse.toString();
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

        console.log('Azure Storage Write Request:', {
            requestedPath: filePath,
            dirPath,
            fileName,
            shareName: this.fileShare.name
        });

        const directoryClient = dirPath ? this.getDirectoryClient(dirPath) : this.fileShare.rootDirectoryClient;
        const fileClient = directoryClient.getFileClient(fileName);

        const buffer = Buffer.from(content);
        await fileClient.uploadData(buffer, {
            rangeSize: buffer.length
        });
    }

    async deleteFile(filePath: string): Promise<void> {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

        console.log('Azure Storage Delete Request:', {
            requestedPath: filePath,
            dirPath,
            fileName,
            shareName: this.fileShare.name
        });

        const directoryClient = dirPath ? this.getDirectoryClient(dirPath) : this.fileShare.rootDirectoryClient;
        const fileClient = directoryClient.getFileClient(fileName);

        await fileClient.deleteIfExists();
    }

    async fileExists(filePath: string): Promise<boolean> {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

        console.log('Azure Storage File Exists Check:', {
            requestedPath: filePath,
            dirPath,
            fileName,
            shareName: this.fileShare.name
        });

        const directoryClient = dirPath ? this.getDirectoryClient(dirPath) : this.fileShare.rootDirectoryClient;
        const fileClient = directoryClient.getFileClient(fileName);

        return await fileClient.exists();
    }

    async listFiles(dirPath: string): Promise<string[]> {
        console.log('Azure Storage List Files Request:', {
            fileShare: this.fileShare.name,
            dirPath: dirPath
        });

        const directoryClient = dirPath ? this.getDirectoryClient(dirPath) : this.fileShare.rootDirectoryClient;
        const files: string[] = [];

        try {
            // Use for-await to iterate through all entries
            for await (const entity of directoryClient.listFilesAndDirectories()) {
                if (entity.kind === 'file' && entity.name.endsWith('.json')) {
                    files.push(entity.name);
                }
            }
        } catch (error) {
            console.error('Error listing files:', {
                message: String(error),
                code: (error as any).code,
                details: (error as any).details
            });
            throw error;
        }

        console.log('Final file list:', {
            fileShare: this.fileShare.name,
            directory: dirPath,
            files: files
        });
        return files;
    }

    async listDirectories(dirPath: string): Promise<string[]> {
        const directoryClient = dirPath ? this.getDirectoryClient(dirPath) : this.fileShare.rootDirectoryClient;
        const directories: string[] = [];
        for await (const entity of directoryClient.listFilesAndDirectories()) {
            if (entity.kind === 'directory') {
                directories.push(entity.name);
            }
        }
        return directories;
    }

    async ensureDirectory(dirPath: string): Promise<void> {
        console.log('Azure Storage Ensure Directory:', {
            dirPath,
            shareName: this.fileShare.name
        });

        if (!dirPath) return; // Don't create root directory
        const directoryClient = this.getDirectoryClient(dirPath);
        await directoryClient.createIfNotExists();
    }

    async directoryExists(dirPath: string): Promise<boolean> {
        console.log('Azure Storage Directory Exists Check:', {
            dirPath,
            shareName: this.fileShare.name
        });

        if (!dirPath) return true; // Root directory always exists
        const directoryClient = this.getDirectoryClient(dirPath);
        return await directoryClient.exists();
    }

    async deleteDirectory(dirPath: string): Promise<void> {
        console.log('Azure Storage Delete Directory Request:', {
            requestedPath: dirPath,
            shareName: this.fileShare.name
        });

        const directoryClient = this.getDirectoryClient(dirPath);
        try {
            await directoryClient.deleteIfExists();
        } catch (error) {
            throw new Error(`Error deleting directory ${dirPath}: ${String(error)}`);
        }
    }

    private getDirectoryClient(dirPath: string): ShareDirectoryClient {
        return this.fileShare.getDirectoryClient(dirPath);
    }
}