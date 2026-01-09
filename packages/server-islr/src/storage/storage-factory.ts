import { IStorageHandler } from './istorage-handler.js';
import { AzureStorageHandler } from './azure-storage-handler.js';
import { LocalStorageHandler } from './local-storage-handler.js';
import { env } from '../config/env.js';

export class StorageFactory {
    static getStorageHandler(): IStorageHandler {
        if (env.storage === 'azure') {
            return new AzureStorageHandler();
        }

        // Default to local storage
        return new LocalStorageHandler();
    }
}