import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json (at runtime, this file is in dist/config/)
let packageVersion = 'unknown';
try {
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    packageVersion = packageJson.version;
} catch {
    // Fallback if package.json cannot be read
}

// Build number from CI/CD environment variable, or 'local' for local dev
const buildNumber = process.env.BUILD_NUMBER || 'local';

// Server start timestamp — changes with each deployment/restart
const startedAt = new Date().toISOString();

export const serverVersion = {
    name: 'CRCHub Server',
    version: packageVersion,
    build: buildNumber,
    startedAt,
};

/** Human-readable version string, e.g. "CRCHub Server v2.1.0 (build: 42)" */
export const versionString = `CRCHub Server v${packageVersion} (build: ${buildNumber})`;
