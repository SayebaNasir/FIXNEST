import { io } from 'socket.io-client';

let socket = null;

// Reuses a single connection for the whole app session
export const getSocket = (token) => {
  if (!socket) {
    socket = io('http://localhost:5001', {
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