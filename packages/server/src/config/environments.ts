export type Environment = 'local' | 'development' | 'staging' | 'production';

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
        serverUrl: 'http://localhost:8080',
        serverPort: 8080,
        serverTimeout: 2000,
        corsOrigins: [
            'http://127.0.0.1:8004', 'http://localhost:8004'
        ],
        storeBasePath: './datastore',
        logLevel: 'debug'
    },
    development: {
        serverUrl: 'https://crchub-server.azurewebsites.net',
        serverPort: 8080,
        serverTimeout: 5000,
        corsOrigins: [
            'https://crchub-webapp.azurewebsites.net',
            'http://127.0.0.1:8004', 'http://localhost:8004'
        ],
        storeBasePath: '/home/site/wwwroot/datastore',
        logLevel: 'debug'
    },
    staging: {
        serverUrl: 'https://crchub-server.azurewebsites.net',
        serverPort: 8080,
        serverTimeout: 5000,
        corsOrigins: [
            'https://crchub-webapp.azurewebsites.net',
            'http://127.0.0.1:8004', 'http://localhost:8004'
        ],
        storeBasePath: '/home/site/wwwroot/datastore',
        logLevel: 'info'
    },
    production: {
        serverUrl: 'https://crchub-server.azurewebsites.net',
        serverPort: 8080,
        serverTimeout: 5000,
        corsOrigins: [
            'https://crchub-webapp.azurewebsites.net',
            'http://127.0.0.1:8004', 'http://localhost:8004'
        ],
        storeBasePath: '/home/site/wwwroot/datastore',
        logLevel: 'error'
    }
}; 