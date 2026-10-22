import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;

interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        try {
          const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
          socket.data.user = decoded;
        } catch {
          // Token invalid, allow connection as guest or continue
        }
      }
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // If user was authenticated via handshake
    if (socket.data.user?.userId) {
      const { userId, role } = socket.data.user;
      socket.join(`user:${userId}`);
      socket.join(`role:${role}`);
      logger.debug(`User ${userId} (${role}) joined socket rooms`);
    }

    // Client can also emit 'authenticate' with user info
    socket.on('authenticate', (data: { userId: string; role: string }) => {
      if (data?.userId) {
        socket.join(`user:${data.userId}`);
      }
      if (data?.role) {
        socket.join(`role:${data.role}`);
      }
      logger.debug(`Socket ${socket.id} authenticated for user:${data?.userId} role:${data?.role}`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('✅ Socket.IO service initialized');
  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
  }
};

export const emitToRole = (role: string, event: string, payload: unknown) => {
  if (io) {
    io.to(`role:${role}`).emit(event, payload);
  }
};

export const broadcastEvent = (event: string, payload: unknown) => {
  if (io) {
    io.emit(event, payload);
  }
};
