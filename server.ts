const PORT = process.env.PORT || 3000;
const LoggerServer = require('./src/utils/logger');
const appServer = require('./src/app');
const { initializeDatabaseServer } = require('./config/database');

const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabaseServer();
    
    // Start server
    const server =appServer.listen(PORT, () => {
      LoggerServer.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV,
        port: PORT
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      LoggerServer.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        LoggerServer.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      LoggerServer.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        LoggerServer.info('Process terminated');
        process.exit(0);
      });
    });

  }  catch (error: unknown) {
    if (error instanceof Error) {
      LoggerServer.error('Failed to start server', { error: error.message });
    } else {
      LoggerServer.error('Failed to start server', { error });
    }
    process.exit(1);
  }
};

startServer();