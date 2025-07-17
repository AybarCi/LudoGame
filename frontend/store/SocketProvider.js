import React, { createContext, useContext, useState, useMemo } from 'react';
import { io } from 'socket.io-client';


// Socket instance will be created lazily, not here.
let socket = null;

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => {
    const connect = (user) => {
      if (socket && socket.connected) {
        console.log('[SocketProvider] Already connected.');
        return;
      }

      // LAZY INITIALIZATION: Create socket instance on first connect call.
      if (!socket) {
        const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
        if (!socketUrl) {
          console.error('[FATAL] EXPO_PUBLIC_SOCKET_URL is not defined. Cannot connect.');
          return;
        }

        console.log(`[SocketProvider] First connection. Creating socket instance for ${socketUrl}`);
        socket = io(socketUrl, {
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
          transports: ['websocket'],
        });

        // Set up listeners only once when the socket is created
        socket.on('connect', () => {
          console.log(`[SocketProvider] Connected with id: ${socket.id}`);
          setIsConnected(true);
        });

        socket.on('disconnect', (reason) => {
          console.log(`[SocketProvider] Disconnected: ${reason}`);
          setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
          console.error(`[SocketProvider] Connection Error: ${err.message}`);
        });
      }

      console.log(`[SocketProvider] Manual connect initiated for user: ${user.id}`);
      socket.auth = { userId: user.id, nickname: user.user_metadata?.nickname };
      socket.connect();
    };

    const disconnect = () => {
      if (!socket || !socket.connected) {
        console.log('[SocketProvider] Already disconnected or socket not created.');
        return;
      }
      console.log('[SocketProvider] Manual disconnect initiated.');
      socket.disconnect();
    };



    return {
      socket,
      isConnected,
      connect,
      disconnect,
    };
  }, [isConnected]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
