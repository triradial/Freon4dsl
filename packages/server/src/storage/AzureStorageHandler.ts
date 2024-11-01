import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { IStorageHandler } from './IStorageHandler.js';

export class AzureStorageHandler implements IStorageHandler {
    private blobServiceClient: BlobServiceClient;
    private containerName: string;

    constructor() {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('Azure Storage connection string not found');
        }
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        this.containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'models';
    }

    async readFile(filePath: string): Promise<string> {
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(filePath);
        const downloadResponse = await blockBlobClient.download();
        const blobBody = await downloadResponse.blobBody;
        
        if (!blobBody) {
            throw new Error('Failed to download blob content');
        }
       
        return await streamToString(blobBody);
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(filePath);
        await blockBlobClient.uploadData(Buffer.from(content), {
            blobHTTPHeaders: { blobContentType: 'application/json' }
        });
    }

    async deleteFile(filePath: string): Promise<void> {
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(filePath);
        await blockBlobClient.delete();
    }

    async fileExists(filePath: string): Promise<boolean> {
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(filePath);
        return await blockBlobClient.exists();
    }
    
    async listFiles(dirPath: string): Promise<string[]> {
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        const files: string[] = [];
        
        // List all blobs that start with the directory path
        for await (const blob of containerClient.listBlobsFlat({
            prefix: dirPath + '/'
        })) {
            // Remove the directory prefix to get just the filename
            const fileName = blob.name.replace(dirPath + '/', '');
            if (fileName) { // Only add if there's a filename (ignore empty directory markers)
                files.push(fileName);
            }
        }
        
        return files;
    }

    async ensureDirectory(dirPath: string): Promise<void> {
        // Azure Blob Storage doesn't need directory creation
        // Directories are implicit based on blob names
        return Promise.resolve();
    }

    async directoryExists(dirPath: string): Promise<boolean> {
        const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
        
        // Check if there are any blobs with this prefix
        const iterator = containerClient.listBlobsFlat({
            prefix: dirPath + '/'
        }).byPage({ maxPageSize: 1 });
        
        const firstPage = await iterator.next();
        return !firstPage.done;
    }

}

// Updated helper function to handle both Blob and ReadableStream
async function streamToString(stream: NodeJS.ReadableStream | ReadableStream | Blob): Promise<string> {
    if (stream instanceof Blob) {
        return await stream.text();
    }

    // Handle ReadableStream
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        if ('on' in stream) {
            // NodeJS.ReadableStream
            stream.on('data', (data) => chunks.push(data.toString()));
            stream.on('end', () => resolve(chunks.join('')));
            stream.on('error', reject);
        } else {
            // Web ReadableStream
            const reader = (stream as ReadableStream).getReader();
            const decoder = new TextDecoder();
            
            async function read() {
                const { done, value } = await reader.read();
                if (done) {
                    resolve(chunks.join(''));
                    return;
                }
                chunks.push(decoder.decode(value, { stream: true }));
                await read();
            }
            
            read().catch(reject);
        }
    });
}
