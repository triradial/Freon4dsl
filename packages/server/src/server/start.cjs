// Add uncaught exception handler for Azure logging
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Log stack trace for Azure diagnostics
    console.error(err.stack);
});

// Add unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
    try {
        console.log('Starting server from:', __dirname);
        console.log('Node version:', process.version);
        console.log('Environment:', process.env.NODE_ENV);
        
        const { default: app } = await import('./server-starter.js');
        console.log('Server started successfully');
    } catch (error) {
        console.error('Failed to start server:', error);
        // Log stack trace for Azure diagnostics
        console.error(error.stack);
        process.exit(1);
    }
}

startServer().catch(err => {
    console.error('Top level error:', err);
    console.error(err.stack);
    process.exit(1);
});