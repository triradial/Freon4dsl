// Basic test to see if this file is being executed
const fs = require('fs');
const path = require('path');

// Create a test log file in the root directory
const logPath = path.join(__dirname, 'startup-test.log');

try {
    fs.writeFileSync(logPath, `Server started at ${new Date().toISOString()}\n`);
    fs.appendFileSync(logPath, `Directory: ${__dirname}\n`);
    fs.appendFileSync(logPath, `Node version: ${process.version}\n`);
    fs.appendFileSync(logPath, `Environment: ${process.env.NODE_ENV}\n`);

    // Try to list the directory contents
    const files = fs.readdirSync(__dirname);
    fs.appendFileSync(logPath, `Directory contents: ${JSON.stringify(files, null, 2)}\n`);

} catch (error) {
    // If we can't write to the log file, try writing to a different location
    const fallbackPath = path.join(process.cwd(), 'fallback-startup-test.log');
    fs.writeFileSync(fallbackPath, `Error: ${error.message}\n${error.stack}`);
}

// Only after we confirm this works, we'll add back the server starter code
// const { default: app } = await import('./server-starter.js');