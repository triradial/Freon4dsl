process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

async function startServer() {
    try {
        console.log('Starting server from:', __dirname);
        const { default: app } = await import('./server-starter.js');
        console.log('Server started successfully');
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer().catch(err => {
    console.error('Top level error:', err);
    process.exit(1);
});