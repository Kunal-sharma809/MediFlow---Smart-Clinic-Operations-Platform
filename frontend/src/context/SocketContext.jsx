import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const { activeClinic } = useAuth();

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Connected to real-time server:', newSocket.id);
      setConnected(true);
      if (activeClinic && activeClinic._id) {
        newSocket.emit('join_clinic', activeClinic._id);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket.IO] Disconnected from server');
      setConnected(false);
    });

    newSocket.on('queue_updated', (data) => {
      console.log('[Socket.IO Event] queue_updated:', data);
      setLastEvent(data);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [activeClinic]);

  return (
    <SocketContext.Provider value={{ socket, connected, lastEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
