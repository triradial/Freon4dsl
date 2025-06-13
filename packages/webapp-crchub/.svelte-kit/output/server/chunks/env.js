const environments = {
  local: {
    serverUrl: "http://localhost:8080",
    serverTimeout: 2e3
  },
  development: {
    serverUrl: "https://crchub-server.azurewebsites.net",
    serverTimeout: 5e3
  },
  staging: {
    serverUrl: "https://crchub-server.azurewebsites.net",
    serverTimeout: 5e3
  },
  production: {
    serverUrl: "https://crchub-server.azurewebsites.net",
    serverTimeout: 5e3
  }
};
const currentEnv = "local";
if (!Object.keys(environments).includes(currentEnv)) {
  throw new Error(`Invalid environment: ${currentEnv}`);
}
const env = {
  ...environments[currentEnv],
  environment: currentEnv,
  isProduction: currentEnv === "production",
  isDevelopment: currentEnv === "development",
  isLocal: currentEnv === "local"
};
export {
  env as e
};
