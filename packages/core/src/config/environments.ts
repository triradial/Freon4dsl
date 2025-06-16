export type Environment = 'local' | 'development' | 'staging' | 'production';

export interface ServerConfig {
    serverUrl: string;
    serverTimeout: number;
}

export const defaultServerConfig: ServerConfig = {
    serverUrl: 'http://localhost:8080',
    serverTimeout: 2000
};