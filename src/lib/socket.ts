import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => socket;

export const initSocket = () => {
  if (socket) {
    return socket;
  }
  const url = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
  socket = io(url, {
    autoConnect: false,
  });
  return socket;
};
