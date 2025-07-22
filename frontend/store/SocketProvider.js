import React, { createContext, useContext, useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
    const [room, setRoom] = useState(null);
    const [roomClosed, setRoomClosed] = useState({ isClosed: false, reason: '' });
    const [socketId, setSocketId] = useState();
    const lastRoomIdRef = useRef(null); // Son girilen odayı saklamak için ref

    // Bağlantı yeniden kurulduğunda odaya tekrar katılmayı dene
    useEffect(() => {
        if (isConnected && lastRoomIdRef.current && !room) {
            console.log(`[Auto-Rejoin] Bağlantı kuruldu, odaya tekrar katılınıyor: ${lastRoomIdRef.current}`);
            socketRef.current.emit('join_room', { roomId: lastRoomIdRef.current }, (response) => {
                if (response.success) {
                    console.log('[Auto-Rejoin] Odaya başarıyla tekrar katıldı.');
                    setRoom(response.room);
                } else {
                    console.error(`[Auto-Rejoin] Odaya tekrar katılım başarısız: ${response.message}`);
                    lastRoomIdRef.current = null; // Başarısız olursa ref'i temizle
                }
            });
        }
    }, [isConnected, room]);

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
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000,
                    timeout: 20000,
                    forceNew: true,
                    upgrade: true,
                    rememberUpgrade: false,
                    transports: ['websocket', 'polling'],
                });

                // Listener'ları sadece bir kez, soket oluşturulduğunda ekle
                socketRef.current.on('connect', () => {
                    console.log(`[SocketProvider] ✅ Sunucuya bağlanıldı! ID: ${socketRef.current.id}`);
                    setSocketId(socketRef.current.id);
                    setIsConnected(true);
                });

                socketRef.current.on('disconnect', (reason) => {
                    console.log(`[SocketProvider] ❌ Bağlantı kesildi: ${reason}`);
                    setSocketId(undefined);
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

                // Oda güncellendiğinde tetiklenecek
                socketRef.current.on('room_updated', (updatedRoom) => {
                    console.log('[SocketProvider] Oda güncellendi:', updatedRoom.id, 'Phase:', updatedRoom.gameState?.phase);
                    setRoom(updatedRoom);
                });
            }

            // Kullanıcı bilgileriyle birlikte manuel olarak bağlan
            console.log(`[SocketProvider] Kullanıcı ile bağlantı başlatılıyor: ${user.id}`);
            socketRef.current.auth = { userId: user.id, nickname: user.user_metadata?.nickname };
            socketRef.current.connect();
        };

        const joinRoom = (roomId, nickname, callback) => {
            if (!socketRef.current?.connected) {
                console.error('[SocketProvider] Odaya katılmak için önce bağlanılmalı.');
                return callback({ success: false, message: 'Sunucuya bağlı değil.' });
            }
            socketRef.current.emit('join_room', { roomId, nickname }, (response) => {
                if (response.success) {
                    console.log(`[SocketProvider] Odaya katıldı: ${roomId}`);
                    setRoom(response.room);
                    lastRoomIdRef.current = response.room.id; // Odaya başarıyla katılınca ref'i güncelle
                }
                callback(response);
            });
        };

        const leaveRoom = () => {
            if (socketRef.current && room) {
                console.log(`[SocketProvider] Odadan ayrılıyor: ${room.id}`);
                socketRef.current.emit('leave_room');
                setRoom(null);
                lastRoomIdRef.current = null; // Odadan ayrılınca ref'i temizle
            }
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
            room,
            setRoom, // Dışarıdan güncelleme için
            roomClosed,
            socketId,
            // Game state values extracted from room
            gameState: room?.gameState,
            players: room?.players || [],
            currentTurn: room?.gameState?.currentPlayer,
            winner: room?.gameState?.winner,
            dice: room?.gameState?.diceValue,
            validMoves: room?.gameState?.validMoves || [],
            turnOrder: room?.gameState?.turnOrder || [],
            preGameRolls: room?.gameState?.turnOrderRolls || [],
            connect,
            joinRoom,
            leaveRoom,
            disconnect,
        };
    }, [isConnected, room]); // isConnected veya room değiştiğinde contextValue yeniden hesaplanır

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};