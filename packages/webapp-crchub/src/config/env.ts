import { type Environment, environments } from './environments.js';

// Get environment from process.env or default to 'local'
const getEnvironment = (): Environment => {
    try {
        return (process.env.AZURE_ENVIRONMENT as Environment) || 'local';
    } catch (error) {
        console.warn('Error detecting environment:', error);
        return 'local';
    }
};

const currentEnv = getEnvironment();

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