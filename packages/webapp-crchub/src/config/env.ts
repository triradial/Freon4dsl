import { type Environment, environments } from './environments.js';

// Get environment from Azure App Service or default to 'local'
// Normalize to lowercase since workflow inputs may use capitalized values (e.g. "Development")
const currentEnv = ((import.meta.env.VITE_AZURE_ENVIRONMENT || 'local') as string).toLowerCase() as Environment;

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