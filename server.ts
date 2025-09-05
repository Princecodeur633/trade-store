// server.ts
import dotenv from 'dotenv';
dotenv.config();

import app from './src/app';
import Logger from './src/utils/logger';
import { initializeDatabase } from './src/config/database';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialisation de la base de données
    await initializeDatabase();

    // Démarrage du serveur
    const server = app.listen(PORT, () => {
      Logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV,
        port: PORT
      });
    });

    // Gestion des arrêts gracieux
    const shutdown = (signal: string) => {
      Logger.info(`${signal} received, shutting down gracefully`);
      server.close(() => {
        Logger.info('Process terminated');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    Logger.error('Failed to start server', { error: message });
    process.exit(1);
  }
};

startServer();
