// This is a CommonJS wrapper that imports our ESM app
async function startServer() {
    try {
        await import('./server-starter.js');
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();