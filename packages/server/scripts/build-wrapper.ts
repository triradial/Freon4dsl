import * as fs from 'fs';
import * as path from 'path';

const wrapperContent = `
async function startServer() {
    try {
        await import('./server-starter.js');
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
`;

// Ensure the output directory exists
const outputDir = path.join(process.cwd(), 'dist', 'server');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'start.cjs');
fs.writeFileSync(outputPath, wrapperContent);
console.log(`Created wrapper file at: ${outputPath}`);