import { io } from 'socket.io-client';
import { API_URL } from './config/api';

let socket = null;

// Reuses a single connection for the whole app session
export const getSocket = (token) => {
  if (!socket) {
    socket = io(API_URL, {
      auth: { token },
      autoConnect: false
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};