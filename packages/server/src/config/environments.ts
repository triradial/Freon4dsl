export type Environment = 'local';

export interface EnvironmentConfig {
    serverUrl: string;
    serverPort: number;
    serverTimeout: number;
    corsOrigins: string[];
    storeBasePath: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export const environments: Record<Environment, EnvironmentConfig> = {
    local: {
        serverUrl: 'http://localhost:8001',
        serverPort: 8001,
        serverTimeout: 2000,
        corsOrigins: [
            'http://127.0.0.1:8000', 'http://localhost:8000'
        ],
        storeBasePath: './modelstore',
        logLevel: 'debug'
    }
}; 