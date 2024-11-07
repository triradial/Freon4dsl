export type Environment = "local" | "development" | "staging" | "production";

export interface EnvironmentConfig {
    serverUrl: string;
    serverTimeout: number;
}

export const environments: Record<Environment, EnvironmentConfig> = {
    local: {
        serverUrl: 'http://localhost:8080',
        serverTimeout: 2000
    },
    development: {
        serverUrl: 'https://crchub-server.azurewebsites.net',
        serverTimeout: 5000
    },
    staging: {
        serverUrl: 'https://crchub-server.azurewebsites.net',
        serverTimeout: 5000
    },
    production: {
        serverUrl: 'https://crchub-server.azurewebsites.net',
        serverTimeout: 5000
    }
}; 
