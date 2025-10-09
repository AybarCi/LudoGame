import React, { createContext, useContext, useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

// Context oluştur
const SocketContext = createContext(null);

// 2. Kolay erişim için hook'u oluştur
export const useSocket = ({
  onGameUpdate,
  onPlayerJoined,
  onPlayerLeft,
  onGameStarted,
  onTurnUpdate,
  onDiceRolled,
  onPawnMoved,
  onGameFinished,
  onNewMessage,
  onRoomUpdate,
  onProfanityWarning,
  onMessageBlocked
} = {}) => {
    const context = useContext(SocketContext);
    
    // Profanity callback'lerini set et - güvenli kullanım
    useEffect(() => {
        if (context && typeof context.setProfanityCallbacks === 'function') {
            context.setProfanityCallbacks(onProfanityWarning, onMessageBlocked);
        }
    }, [onProfanityWarning, onMessageBlocked, context?.setProfanityCallbacks]);
    
    return context || {};
};

// 3. Provider bileşenini oluştur
export const SocketProvider = ({ children }) => {
    const authState = useSelector(state => state.auth || {}); // Güvenli selector kullanımı
    const user = authState.user;
    const session = authState.token;
    const socketRef = useRef(null); // Soket örneğini re-render'lar arasında korumak için ref kullan
    const [isConnected, setIsConnected] = useState(false);
    const [room, setRoom] = useState(null);
    const [roomClosed, setRoomClosed] = useState({ isClosed: false, reason: '' });
    const [socketId, setSocketId] = useState();
    const [chatMessages, setChatMessages] = useState([]);
    const lastRoomIdRef = useRef(null); // Son girilen odayı saklamak için ref
    const profanityCallbacksRef = useRef({ onProfanityWarning: null, onMessageBlocked: null });

    const movePawn = useCallback((pawnId) => {
        if (socketRef.current && room?.id) {
            console.log(`[Socket] Emitting 'move_pawn' for pawn: ${pawnId}`);
            socketRef.current.emit('move_pawn', { roomId: room.id, pawnId });
        }
    }, [room?.id]);

    const sendMessage = useCallback((message) => {
        console.log('[SocketProvider] sendMessage called with:', message);
        console.log('[SocketProvider] Socket connected:', socketRef.current?.connected);
        console.log('[SocketProvider] Room ID:', room?.id);
        if (socketRef.current && room?.id && message.trim()) {
            console.log(`[Socket] Sending message: ${message}`);
            socketRef.current.emit('send_message', { roomId: room.id, message: message.trim() });
        } else {
            console.log('[SocketProvider] Cannot send message - missing requirements');
        }
    }, [room?.id]);

    const disconnect = useCallback(() => {
        if (!socketRef.current?.connected) {
            console.log('[SocketProvider] Zaten bağlı değil.');
            return;
        }
        console.log('[SocketProvider] Bağlantı manuel olarak kesiliyor.');
        socketRef.current.disconnect();
    }, []);

    // Session değiştiğinde socket bağlantısını güncelle
    useEffect(() => {
        console.log('[SocketProvider] useEffect tetiklendi - session:', session);
        console.log('[SocketProvider] useEffect tetiklendi - user:', user);
        console.log('[SocketProvider] useEffect tetiklendi - user detay:', user ? {
            id: user.id,
            nickname: user.nickname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            score: user.score,
            hasId: !!user.id,
            hasNickname: !!user.nickname
        } : 'NO_USER');
        
        if (!session) {
            // Session yoksa bağlantıyı kes
            if (socketRef.current) {
                console.log('[SocketProvider] Session yok, bağlantı kesiliyor');
                socketRef.current.disconnect();
                setIsConnected(false);
                setRoom(null);
                setSocketId(null);
            }
            return;
        }

        // Session varsa veya değiştiyse bağlantı kur/yenile
        if (!socketRef.current || !socketRef.current.connected) {
            console.log('[SocketProvider] Session mevcut, bağlantı kuruluyor');
            if (user) {
                console.log('[SocketProvider] User objesi mevcut, bağlantı kuruluyor');
                
                // Extract actual user object if it's wrapped in success property
                const actualUser = user.success && user.user ? user.user : user;
                
                // Kullanıcı objesinin gerekli alanlarını kontrol et
                if (!actualUser.id || !actualUser.nickname) {
                    console.error('[SocketProvider] User objesi eksik alanlara sahip:', {
                        hasId: !!actualUser.id,
                        hasNickname: !!actualUser.nickname,
                        user: actualUser
                    });
                    return;
                }
                
                // connect fonksiyonunu çağır (contextValue içinde tanımlı)
                if (actualUser) {
                    // Kullanıcı objesinin gerekli alanlarını kontrol et
                    if (!actualUser.id || !actualUser.nickname) {
                        console.error('[SocketProvider] User objesi eksik alanlara sahip:', {
                            hasId: !!actualUser.id,
                            hasNickname: !!actualUser.nickname,
                            user: actualUser
                        });
                        return;
                    }
                    
                    if (!socketRef.current) {
                    const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.1.135:3001';
                    console.log('[SocketProvider] Creating socket with auth (useEffect):', {
                    userId: actualUser.id,
                    nickname: actualUser.nickname,
                    token: session ? 'TOKEN_EXISTS' : 'NO_TOKEN',
                    tokenLength: session ? session.length : 0,
                    tokenStart: session ? session.substring(0, 20) + '...' : 'null'
                });
                    socketRef.current = io(socketUrl, {
                        auth: { 
                            userId: actualUser.id,
                            nickname: actualUser.nickname,
                            token: session // Session now contains the JWT token
                        },
                            autoConnect: false,
                            reconnection: true,
                            reconnectionAttempts: 10,
                            reconnectionDelay: 1000,
                            reconnectionDelayMax: 5000,
                            timeout: 20000,
                            transports: ['websocket', 'polling'],
                            pingTimeout: 60000,
                            pingInterval: 25000,
                            upgradeTimeout: 10000,
                            forceNew: false,
                            rememberUpgrade: true,
                            enableAutoUpgrade: true
                        });
                        
                        // Event listeners ekle
                        socketRef.current.on('connect', () => {
                            console.log(`[SocketProvider] ✅ Sunucuya bağlanıldı! ID: ${socketRef.current.id}`);
                            setSocketId(socketRef.current.id);
                            setIsConnected(true);
                        });
                        
                        socketRef.current.on('disconnect', (reason) => {
                            console.log(`[SocketProvider] ❌ Bağlantı kesildi: ${reason}`);
                            setSocketId(undefined);
                            setIsConnected(false);
                            
                            // Bağlantı kopma nedenine göre özel işlemler
                            if (reason === 'io server disconnect') {
                                console.log('[SocketProvider] Sunucu tarafından kapatıldı');
                            } else if (reason === 'ping timeout') {
                                console.log('[SocketProvider] Ping timeout - ağ bağlantısı sorunu');
                            } else if (reason === 'transport close') {
                                console.log('[SocketProvider] Transport bağlantısı kapandı');
                            }
                            
                            // Room state'ini güvenli şekilde temizle
                            setRoom(null);
                            setRoomClosed({ isClosed: true, reason: 'Bağlantı kesildi' });
                        });
                        
                        socketRef.current.on('connect_error', (err) => {
                            console.error(`[SocketProvider] ❌ Bağlantı Hatası: ${err.message}`);
                            
                            // Hata türüne göre özel işlemler
                            if (err.message.includes('xhr poll error')) {
                                console.log('[SocketProvider] XHR poll hatası - ağ bağlantısı yok');
                            } else if (err.message.includes('timeout')) {
                                console.log('[SocketProvider] Bağlantı zaman aşımı');
                            }
                        });
                        
                        socketRef.current.on('error', (err) => {
                            console.error(`[SocketProvider] Soket Hatası: ${err.message}`);
                        });
                        
                        socketRef.current.on('reconnect', (attemptNumber) => {
                            console.log(`[SocketProvider] 🔄 Başarıyla yeniden bağlandı (deneme: ${attemptNumber})`);
                        });
                        
                        socketRef.current.on('reconnect_attempt', (attemptNumber) => {
                            console.log(`[SocketProvider] 🔄 Yeniden bağlanma denemesi: ${attemptNumber}`);
                        });
                        
                        socketRef.current.on('reconnect_failed', () => {
                            console.error('[SocketProvider] ❌ Tüm yeniden bağlanma denemeleri başarısız');
                        });
                    }
                    
                    socketRef.current.connect();
                } else {
                    console.warn('[SocketProvider] User objesi yok, socket bağlantısı kurulmuyor!');
                }
            } else {
                console.warn('[SocketProvider] User objesi yok, socket bağlantısı kurulmuyor!');
            }
        } else {
            // Eğer socket bağlı ama session değiştiyse, auth bilgilerini güncelle
            console.log('[SocketProvider] Session güncellendi, auth bilgileri yenileniyor');
            console.log('[SocketProvider] Yeni session var mı:', !!session);
            console.log('[SocketProvider] Yeni session uzunluğu:', session ? session.length : 0);
            
            // Extract actual user object if it's wrapped in success property
            const actualUser = user?.success && user?.user ? user.user : user;
            
            socketRef.current.auth = {
                userId: actualUser?.id,
                nickname: actualUser?.nickname,
                token: session // Session now contains the JWT token
            };
            // Yeniden bağlan
            socketRef.current.disconnect();
            socketRef.current.connect();
        }

        // Cleanup function
        return () => {
            if (socketRef.current) {
                console.log('[SocketProvider] Component unmount, bağlantı kesiliyor');
                socketRef.current.disconnect();
            }
        };
    }, [session]);

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
    const setProfanityCallbacks = useCallback((onProfanityWarning, onMessageBlocked) => {
        profanityCallbacksRef.current = { onProfanityWarning, onMessageBlocked };
    }, []);

    const contextValue = useMemo(() => {
        const connect = (connectUser) => {
            // Zaten bağlıysa veya kullanıcı yoksa işlem yapma
            if (socketRef.current?.connected) {
                console.log('[SocketProvider] Zaten bağlı.');
                return;
            }
            if (!connectUser) {
                console.error('[SocketProvider] Bağlanmak için kullanıcı bilgisi gerekli!');
                return;
            }

            // Debug: Kullanıcı objesinin yapısını kontrol et
            console.log('[SocketProvider] connect() fonksiyonuna gelen user:', {
                id: connectUser.id,
                nickname: connectUser.nickname,
                email: connectUser.email,
                phoneNumber: connectUser.phoneNumber,
                score: connectUser.score,
                hasId: !!connectUser.id,
                hasNickname: !!connectUser.nickname
            });

            // Kullanıcı objesinin gerekli alanlarını kontrol et
            if (!connectUser.id || !connectUser.nickname) {
                console.error('[SocketProvider] connect() - User objesi eksik alanlara sahip:', {
                    hasId: !!connectUser.id,
                    hasNickname: !!connectUser.nickname,
                    user: connectUser
                });
                return;
            }

            // Soket örneği daha önce oluşturulmadıysa oluştur (Lazy Initialization)
            if (!socketRef.current) {
                const socketUrl = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.1.135:3001';
                console.log(`[SocketProvider] Socket URL: ${socketUrl}`);

                console.log(`[SocketProvider] İlk bağlantı. Soket oluşturuluyor: ${socketUrl}`);
                console.log('[SocketProvider] Creating socket with auth (contextValue):', {
                    userId: connectUser.id,
                    nickname: connectUser.nickname,
                    token: session ? 'TOKEN_EXISTS' : 'NO_TOKEN',
                    tokenLength: session ? session.length : 0,
                    tokenStart: session ? session.substring(0, 20) + '...' : 'null'
                });
                                socketRef.current = io(socketUrl, {
                    auth: { 
                        userId: connectUser.id,
                        nickname: connectUser.nickname,
                        token: session // Session now contains the JWT token
                    },
                    autoConnect: false, // We will connect manually
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 2000, // Increased delay for better recovery
                    timeout: 20000,
                    transports: ['websocket', 'polling'],
                    pingTimeout: 30000, // 30 seconds to wait for pong
                    pingInterval: 25000, // 25 seconds between pings
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
                    
                    // Clear room state immediately
                    setRoom(null);
                    lastRoomIdRef.current = null;
                    
                    // Show message for 3 seconds then redirect to home
                    setTimeout(() => {
                        setRoomClosed({ isClosed: false, reason: '' });
                        // Navigate to home screen (this will be handled by the consuming component)
                        // We'll add a navigation callback or use a different approach
                    }, 3000);
                });

                // Oyuncu ayrıldığında tetiklenecek
                socketRef.current.on('player_left', (data) => {
                    console.log('[SocketProvider] Oyuncu ayrıldı:', data);
                    
                    // Eğer kalan insan oyuncu sayısı 0 ise oda kapatıldı olarak işaretle
                    if (data.remainingHumanPlayers === 0) {
                        setRoomClosed({ isClosed: true, reason: 'Tüm oyuncular ayrıldı' });
                    }
                });



                // Oyun başladığında tetiklenecek
                socketRef.current.on('game_started', (updatedRoom) => {
                    console.log('[SocketProvider] Oyun başladı! Room:', updatedRoom.id, 'Phase:', updatedRoom.gameState?.phase);
                    setRoom(prevRoom => {
                        const newRoom = { ...prevRoom, ...updatedRoom };
                        if (prevRoom?.gameState && updatedRoom?.gameState) {
                            newRoom.gameState = {
                                ...prevRoom.gameState,
                                ...updatedRoom.gameState,
                            };
                        }
                        return newRoom;
                    });
                });

                // Chat event'leri
                socketRef.current.on('new_message', (message) => {
                    console.log('[SocketProvider] Yeni mesaj alındı:', JSON.stringify(message, null, 2));
                    console.log('[SocketProvider] Message userId:', message.userId);
                    console.log('[SocketProvider] Message userName:', message.userName);
                    console.log('[SocketProvider] Message text:', message.text);
                    
                    setChatMessages(prevMessages => {
                        console.log('[SocketProvider] Önceki mesajlar:', prevMessages);
                        const newMessages = [...prevMessages, message];
                        console.log('[SocketProvider] Yeni mesajlar:', newMessages);
                        return newMessages;
                    });
                });

                // Küfür uyarısı
                socketRef.current.on('profanity_warning', (data) => {
                    console.log('[SocketProvider] Küfür uyarısı alındı:', data);
                    if (profanityCallbacksRef.current.onProfanityWarning) {
                        profanityCallbacksRef.current.onProfanityWarning(data);
                    }
                });

                // Mesaj bloklandı
                socketRef.current.on('message_blocked', (data) => {
                    console.log('[SocketProvider] Mesaj bloklandı:', data);
                    if (profanityCallbacksRef.current.onMessageBlocked) {
                        profanityCallbacksRef.current.onMessageBlocked(data);
                    }
                });

                // Odaya katılırken mevcut mesajları al
                socketRef.current.on('room_updated', (updatedRoom) => {
                    console.log('[SocketProvider] Oda güncellendi:', updatedRoom.id, 'Phase:', updatedRoom.gameState?.phase);
                    console.log('[SocketProvider] players received:', updatedRoom.players);
                    
                    // Chat mesajlarını güncelle
                    if (updatedRoom.chatMessages) {
                        setChatMessages(updatedRoom.chatMessages);
                    }
                    
                    setRoom(prevRoom => {
                        const newRoom = { ...prevRoom, ...updatedRoom };
                        if (prevRoom?.gameState && updatedRoom?.gameState) {
                            newRoom.gameState = {
                                ...prevRoom.gameState,
                                ...updatedRoom.gameState,
                            };
                        }
                        return newRoom;
                    });
                });
            }

            // Kullanıcı bilgileriyle birlikte manuel olarak bağlan
            console.log(`[SocketProvider] Kullanıcı ile bağlantı başlatılıyor: ${connectUser.id}`);
            console.log(`[SocketProvider] Session token var mı: ${!!session}`);
            console.log(`[SocketProvider] Session token uzunluğu: ${session ? session.length : 0}`);
            console.log(`[SocketProvider] Session token başlangıcı: ${session ? session.substring(0, 20) + '...' : 'null'}`);
            
            socketRef.current.auth = { 
                userId: connectUser.id, 
                nickname: connectUser.nickname,
                token: session // Session now contains the JWT token
            };
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





        return {
            socket: socketRef.current,
            isConnected,
            room,
            setRoom, // Dışarıdan güncelleme için
            roomClosed,
            setRoomClosed, // Room closed state'i dışarıdan güncelleme için
            socketId,
            movePawn,
            disconnect,
            // Game state values extracted from room
            gameState: room?.gameState,
            players: room?.players || [],
            currentTurn: room?.gameState?.currentPlayer,
            winner: room?.gameState?.winner,
            dice: room?.gameState?.diceValue,
            validMoves: room?.gameState?.validMoves || [],
            turnOrder: room?.gameState?.turnOrder || [],
            preGameRolls: room?.gameState?.turnOrderRolls || [],
            // Chat functionality
            chatMessages,
            sendMessage,
            setProfanityCallbacks,
            connect,
            joinRoom,
            leaveRoom,
            disconnect,
        };
    }, [isConnected, room, chatMessages]); // isConnected, room veya chatMessages değiştiğinde contextValue yeniden hesaplanır

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};