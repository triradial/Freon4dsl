import { IStorageHandler } from './IStorageHandler.js';
import { AzureStorageHandler } from './AzureStorageHandler.js';
import { LocalStorageHandler } from './LocalStorageHandler.js';
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