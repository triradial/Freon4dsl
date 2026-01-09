import dotenv from 'dotenv';
import path from 'path';
import { consoleLogInfo, consoleLogRaw } from '../server/logging.js';

const moduleName = '[load-environment]';

consoleLogInfo(moduleName, 'Loading environment...');
consoleLogRaw(`Current working directory: ${process.cwd()}`);
consoleLogRaw(`Env file path: ${path.resolve(process.cwd(), '.env')}`);

const result = dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (result.error) {
    consoleLogRaw(`⚠️  Warning: Error loading .env file: ${result.error.message}`);
} else {
    consoleLogInfo(moduleName, `.env file loaded successfully`);
}

consoleLogInfo(moduleName, `AZURE_STORAGE_CONNECTION_STRING exists: ${!!process.env.AZURE_STORAGE_CONNECTION_STRING}`);
consoleLogRaw(`AZURE_STORAGE_SHARE_NAME: ${process.env.AZURE_STORAGE_SHARE_NAME}`);
consoleLogRaw(`AZURE_ENVIRONMENT: ${process.env.AZURE_ENVIRONMENT}`);

// Log database config status (without showing sensitive values)
consoleLogRaw(`DB_HOST: ${process.env.DB_HOST || 'not set'}`);
consoleLogRaw(`DB_NAME: ${process.env.DB_NAME || 'not set'}`);
consoleLogRaw(`DB_USER: ${process.env.DB_USER || 'not set'}`);
consoleLogRaw(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'not set'}`);
consoleLogRaw(`DB_SSL: ${process.env.DB_SSL || 'not set'}`);