import { IStorageHandler } from './IStorageHandler.js';
import { AzureStorageHandler } from './AzureStorageHandler.js';
import { LocalStorageHandler } from './LocalStorageHandler.js';

export class StorageFactory {
    static getStorageHandler(): IStorageHandler {
        const environment = process.env.NODE_ENV || 'development';
        
        if (environment === 'production') {
            return new AzureStorageHandler();
        }
        
        return new LocalStorageHandler();
    }
} 