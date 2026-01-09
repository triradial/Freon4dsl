import { type Environment, environments } from './environments.js';

// Get environment from Azure App Service or default to 'local'
const currentEnv = (import.meta.env.VITE_AZURE_ENVIRONMENT || 'local') as Environment;

if (!Object.keys(environments).includes(currentEnv)) {
    throw new Error(`Invalid environment: ${currentEnv}`);
}

export const env = {
    ...environments[currentEnv],
    environment: currentEnv,
    isProduction: currentEnv === 'production',
    isDevelopment: currentEnv === 'development',
    isLocal: currentEnv === 'local'
};