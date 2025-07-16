import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthProvider';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  useEffect(() => {
    if (!user) {
      socket?.disconnect();
      setSocket(null);
      return;
    }

    const serverURL = process.env.EXPO_PUBLIC_API_URL;
    if (!serverURL) {
        console.error('[SocketProvider] FATAL: EXPO_PUBLIC_API_URL is not defined in .env');
        return;
    }

    console.log(`[SocketProvider] Attempting to connect to: ${serverURL}`);
    const newSocket = io(serverURL, {
      query: { userId: user.id, username: user.username },
      reconnection: false, // We handle this manually
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(`[SocketProvider] Connected with socket id: ${newSocket.id}`);
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`[SocketProvider] Disconnected: ${reason}`);
      // Reconnect by triggering the useEffect hook again after a delay
      if (reason !== 'io server disconnect') {
        setTimeout(() => setReconnectTrigger(t => t + 1), 3000);
      }
    });

    // Cleanup function to disconnect the socket when the component unmounts or user changes
    return () => {
      console.log('[SocketProvider] Cleaning up old socket.');
      newSocket.disconnect();
    };

  }, [user, reconnectTrigger]); // Re-run effect if user or reconnectTrigger changes

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
