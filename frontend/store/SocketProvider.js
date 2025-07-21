import React, { createContext, useContext, useState, useMemo, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// 1. Context'i oluştur
const SocketContext = createContext(null);

// 2. Kolay erişim için hook'u oluştur
export const useSocket = () => {
    return useContext(SocketContext);
};

// 3. Provider bileşenini oluştur
export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null); // Soket örneğini re-render'lar arasında korumak için ref kullan
    const [isConnected, setIsConnected] = useState(false);
    const [roomClosed, setRoomClosed] = useState({ isClosed: false, reason: '' });

    // contextValue'yu memoize ederek gereksiz re-render'ları önle
    const contextValue = useMemo(() => {
        const connect = (user) => {
            // Zaten bağlıysa veya kullanıcı yoksa işlem yapma
            if (socketRef.current?.connected) {
                console.log('[SocketProvider] Zaten bağlı.');
                return;
            }
            if (!user) {
                console.error('[SocketProvider] Bağlanmak için kullanıcı bilgisi gerekli!');
                return;
            }

            // Soket örneği daha önce oluşturulmadıysa oluştur (Lazy Initialization)
            if (!socketRef.current) {
                const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
                if (!socketUrl) {
                    console.error('[FATAL] EXPO_PUBLIC_SOCKET_URL tanımlı değil. Bağlantı kurulamıyor.');
                    return;
                }

                console.log(`[SocketProvider] İlk bağlantı. Soket oluşturuluyor: ${socketUrl}`);
                socketRef.current = io(socketUrl, {
                    autoConnect: false, // Manuel olarak bağlanacağız
                    reconnection: true,
                    transports: ['websocket'],
                });

                // Listener'ları sadece bir kez, soket oluşturulduğunda ekle
                socketRef.current.on('connect', () => {
                    console.log(`[SocketProvider] ✅ Sunucuya bağlanıldı! ID: ${socketRef.current.id}`);
                    setIsConnected(true);
                });

                socketRef.current.on('disconnect', (reason) => {
                    console.log(`[SocketProvider] ❌ Bağlantı kesildi: ${reason}`);
                    setIsConnected(false);
                });

                socketRef.current.on('connect_error', (err) => {
                    console.error(`[SocketProvider] ❌ Bağlantı Hatası: ${err.message}`);
                });

                // Oda kapatıldığında tetiklenecek
                socketRef.current.on('room_closed', (data) => {
                    console.log('[SocketProvider] Oda kapatıldı:', data.reason);
                    setRoomClosed({ isClosed: true, reason: data.reason });
                    // 3 saniye sonra mesajı kaldır
                    setTimeout(() => {
                        setRoomClosed({ isClosed: false, reason: '' });
                    }, 5000);
                });
            }

            // Kullanıcı bilgileriyle birlikte manuel olarak bağlan
            console.log(`[SocketProvider] Kullanıcı ile bağlantı başlatılıyor: ${user.id}`);
            socketRef.current.auth = { userId: user.id, nickname: user.user_metadata?.nickname };
            socketRef.current.connect();
        };

        const disconnect = () => {
            if (!socketRef.current?.connected) {
                console.log('[SocketProvider] Zaten bağlı değil.');
                return;
            }
            console.log('[SocketProvider] Bağlantı manuel olarak kesiliyor.');
            socketRef.current.disconnect();
        };

        return {
            socket: socketRef.current,
            isConnected,
            roomClosed,
            connect,
            disconnect,
        };
    }, [isConnected]); // isConnected değiştiğinde contextValue yeniden hesaplanır

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};