export type Environment = "local" | "development" | "staging" | "production";

// Environment configuration interface
// serverUrl: URL of the server
// serverPort: Port of the server
// serverTimeout: Timeout for the server
// corsOrigins: Origins of the cors (applications that are allowed to access the server)
// logLevel: Level of the log
// storage: Storage configuration (where the data is stored in json format)
export interface EnvironmentConfig {
    serverUrl: string;
    serverPort: number;
    serverTimeout: number;
    corsOrigins: string[];
    logLevel: "debug" | "info" | "warn" | "error";
    storage: "azure" | "local";
}

export const environments: Record<Environment, EnvironmentConfig> = {
    local: {
        serverUrl: "http://localhost:8080",
        serverPort: 8080,
        serverTimeout: 2000,
        corsOrigins: [
            "http://127.0.0.1:8004", 
            "http://localhost:8004", 
            "http://127.0.0.1:8000", 
            "http://localhost:8000",
            "http://localhost:5173",
            "http://localhost:5174"
        ],
        logLevel: "debug",
        storage: "local", // 'azure' or 'local'
    },
    development: {
        serverUrl: "https://crchub-server.azurewebsites.net",
        serverPort: 8080,
        serverTimeout: 5000,
        corsOrigins: ["https://crchub-webapp.azurewebsites.net", "http://127.0.0.1:8004", "http://localhost:8004"],
        logLevel: "debug",
        storage: "azure", // 'azure' only
    },
    staging: {
        serverUrl: "https://crchub-server.azurewebsites.net",
        serverPort: 8080,
        serverTimeout: 5000,
        corsOrigins: ["https://crchub-webapp.azurewebsites.net", "http://127.0.0.1:8004", "http://localhost:8004"],
        logLevel: "info",
        storage: "azure", // 'azure' only
    },
    production: {
        serverUrl: "https://crchub-server.azurewebsites.net",
        serverPort: 8080,
        serverTimeout: 5000,
        corsOrigins: ["https://crchub-webapp.azurewebsites.net", "http://127.0.0.1:8004", "http://localhost:8004"],
        logLevel: "error",
        storage: "azure", // 'azure' only
    },
};
