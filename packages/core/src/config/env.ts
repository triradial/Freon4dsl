import { type Environment, defaultServerConfig } from './environments.js';

const getEnvironment = (): Environment => {
    try {
        // Check if we're in a browser (Vite) environment
        if (typeof import.meta !== 'undefined' &&
            'env' in import.meta &&
            import.meta.env?.VITE_ENVIRONMENT) {
            return (import.meta.env.VITE_ENVIRONMENT as Environment);
        }
        // Check if we're in a Node environment
        if (typeof process !== 'undefined' &&
            process.env?.AZURE_ENVIRONMENT) {
            return (process.env.AZURE_ENVIRONMENT as Environment);
        }
    } catch (error) {
        console.warn('Error detecting environment:', error);
    }
    // Default to local if neither is available
    return 'local';
};

export const env = {
    environment: getEnvironment(),
    isProduction: getEnvironment() === 'production',
    isStaging: getEnvironment() === 'staging',
    isDevelopment: getEnvironment() === 'development',
    isLocal: getEnvironment() === 'local',
    serverConfig: defaultServerConfig
};