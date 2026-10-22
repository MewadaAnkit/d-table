import { createServer } from 'http';
import { app } from './app.js';
import { connectDB } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initSocket } from './services/socket.service.js';

async function startServer() {
  try {
    await connectDB();

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Attendly Server listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Client origin allowed: ${env.CLIENT_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
