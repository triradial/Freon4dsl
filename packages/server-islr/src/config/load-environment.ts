import dotenv from 'dotenv';
import path from 'path';

console.log('Loading environment...');
console.log('Current working directory:', process.cwd());
console.log('Env file path:', path.resolve(process.cwd(), '.env'));

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('AZURE_STORAGE_CONNECTION_STRING exists:', !!process.env.AZURE_STORAGE_CONNECTION_STRING);
console.log('AZURE_STORAGE_SHARE_NAME:', process.env.AZURE_STORAGE_SHARE_NAME);
console.log('AZURE_ENVIRONMENT:', process.env.AZURE_ENVIRONMENT);