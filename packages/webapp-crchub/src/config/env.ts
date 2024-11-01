import { type Environment, environments } from './environments.js';

const currentEnv = (
    (import.meta.env.VITE_ENVIRONMENT as Environment) || 
    (process.env.AZURE_ENVIRONMENT as Environment) || 
    'local'
);

if (!Object.keys(environments).includes(currentEnv)) {
    throw new Error(`Invalid environment: ${currentEnv}`);
}

export const env = {
    ...environments[currentEnv],
    environment: currentEnv,
    isProduction: currentEnv === 'production',
    isStaging: currentEnv === 'staging',
    isDevelopment: currentEnv === 'development',
    isLocal: currentEnv === 'local'
}; 
