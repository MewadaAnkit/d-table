import { io, Socket } from 'socket.io-client';
import { User } from '../types';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => {
  return socket;
};

export const connectSocket = (user?: User | null, token?: string | null): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const socketUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:5000';

  const jwtToken = token || localStorage.getItem('attendly_token');

  socket = io(socketUrl, {
    auth: {
      token: jwtToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    if (user) {
      socket?.emit('authenticate', {
        userId: user._id,
        role: user.role,
      });
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
