import { ShareServiceClient, ShareClient, ShareDirectoryClient } from '@azure/storage-file-share';
import { IStorageHandler } from './IStorageHandler.js';

export class AzureStorageHandler implements IStorageHandler {

    private shareServiceClient: ShareServiceClient;
    private shareClient: ShareClient;
    private basePath: string;

    constructor() {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const shareName = process.env.AZURE_STORAGE_SHARE_NAME || 'datastore';
        const basePath = process.env.AZURE_STORAGE_BASE_PATH || 'datastore';

        if (!connectionString) {
            throw new Error('Azure Storage connection string not found');
        }

        this.shareServiceClient = ShareServiceClient.fromConnectionString(connectionString);
        this.shareClient = this.shareServiceClient.getShareClient(shareName);
        this.basePath = basePath.startsWith('/') ? basePath.slice(1) : basePath;
    }

    private getDirectoryClient(path: string): ShareDirectoryClient {
        const fullPath = `${this.basePath}/${path}`.replace(/\/+/g, '/');
        return this.shareClient.getDirectoryClient(fullPath);
    }

    async readFile(filePath: string): Promise<string> {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        const directoryClient = this.getDirectoryClient(dirPath);
        const fileClient = directoryClient.getFileClient(fileName);

        const downloadResponse = await fileClient.downloadToBuffer();
        return downloadResponse.toString();
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        const directoryClient = this.getDirectoryClient(dirPath);

        // Ensure directory exists
        await directoryClient.createIfNotExists();

        const fileClient = directoryClient.getFileClient(fileName);
        await fileClient.uploadData(Buffer.from(content));
    }

    async deleteFile(filePath: string): Promise<void> {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        const directoryClient = this.getDirectoryClient(dirPath);
        const fileClient = directoryClient.getFileClient(fileName);
        await fileClient.deleteIfExists();
    }

    async fileExists(filePath: string): Promise<boolean> {
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        const directoryClient = this.getDirectoryClient(dirPath);
        const fileClient = directoryClient.getFileClient(fileName);
        return await fileClient.exists();
    }

    async listFiles(dirPath: string): Promise<string[]> {
        const directoryClient = this.getDirectoryClient(dirPath);
        const files: string[] = [];

        let marker;
        do {
            const response = await directoryClient.listFilesAndDirectories().byPage({ maxPageSize: 20 }).next();
            const segment = response.value;

            for (const item of segment.segment.files || []) {
                files.push(item.name);
            }

            marker = segment.continuationToken;
        } while (marker);

        return files;
    }

    async ensureDirectory(dirPath: string): Promise<void> {
        const directoryClient = this.getDirectoryClient(dirPath);
        await directoryClient.createIfNotExists();
    }

    async directoryExists(dirPath: string): Promise<boolean> {
        const directoryClient = this.getDirectoryClient(dirPath);
        return await directoryClient.exists();
    }
}