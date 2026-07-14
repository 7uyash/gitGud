import { io, type Socket } from 'socket.io-client';

import { getToken } from './auth';

const socketUrl = import.meta.env.VITE_GAME_SOCKET_URL ?? 'http://localhost:4102';

let socket: Socket | null = null;

export function getGameSocket() {
  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket'],
      auth: {
        token: getToken(),
      },
    });
  }

  return socket;
}

export function resetGameSocket() {
  socket?.disconnect();
  socket = null;
}