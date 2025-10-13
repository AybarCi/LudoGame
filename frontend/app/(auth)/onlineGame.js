import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BackHandler, Dimensions, Alert, StatusBar, Platform } from 'react-native';
import {
  ImageBackground,
  SafeAreaView,
  Text,
  StyleSheet,
  Animated,
  View,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { showAlert } from '../../store/slices/alertSlice';
import OnlineGameBoard from '../../components/modules/OnlineGameBoard';
import Dice from '../../components/shared/Dice';
import ChatComponent from '../../components/modules/ChatComponent';

import { useSocket } from '../../store/SocketProvider';
import { COLORS } from '../../constants/game';
import LottieView from '../../components/shared/LottieWrapper';
import { Ionicons } from '@expo/vector-icons';
import { DiamondService } from '../../services/DiamondService';
import { AdService } from '../../services/AdService';
import { EnergyService } from '../../services/EnergyService';

const { width, height } = Dimensions.get('window');

// Responsive board sizing
const getBoardSize = () => {
  const screenWidth = width;
  const screenHeight = height;
  const minDimension = Math.min(screenWidth, screenHeight);
  
  // Ekran boyutuna göre board boyutu - optimize edilmiş boyutlar
  if (minDimension > 900) { // Büyük tablet/desktop
    return Math.min(minDimension * 0.75, 700);
  } else if (minDimension > 800) { // Tablet
    return Math.min(minDimension * 0.72, 650);
  } else if (minDimension > 600) { // Büyük telefon
    return Math.min(minDimension * 0.85, 550);
  } else { // Normal telefon
    return Math.min(minDimension * 0.9, 450);
  }
};

// Ekran boyutuna göre container justifyContent ayarla
const getContainerJustifyContent = () => {
  const minDimension = Math.min(width, height);
  // Büyük ekranlarda içeriği ortala, küçük ekranlarda yukarıdan başla
  return minDimension > 800 ? 'center' : 'flex-start';
};

// Android status bar yüksekliğini hesapla
const getStatusBarHeight = () => {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight || 0;
  }
  return 0;
};

const OnlineGameScreen = () => {
  const user = useSelector(state => state.auth.user);
  
  // Extract actual user object if it's wrapped in success property
  const actualUser = user?.success && user?.user ? user.user : user;
  const { roomId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isCreator, setIsCreator] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [chatWarning, setChatWarning] = useState('');
  const [chatBlocked, setChatBlocked] = useState(false);
  const [chatBlockDuration, setChatBlockDuration] = useState(0);
  const [energyChecked, setEnergyChecked] = useState(false);
  // Room closed durumunu state olarak takip et - erken return yerine
  const [isRoomClosed, setIsRoomClosed] = useState(false);
  const [roomClosedReason, setRoomClosedReason] = useState('');
  const dispatch = useDispatch();
  
  // Component mount durumu için ref
  const isMountedRef = useRef(true);
  
  // Navigation tekrarını önlemek için ref
  const hasNavigatedRef = useRef(false);
  
  // Room ID değiştiğinde roomClosed state'ini sıfırlamak için ref
  const previousRoomIdRef = useRef(null);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      console.log('[OnlineGame] Component unmounting, cleaning up...');
      isMountedRef.current = false;
      hasNavigatedRef.current = false; // Navigation flag'ini sıfırla
      
      // Component unmount olurken room closed state'lerini temizle
      console.log('[OnlineGame] Unmount sırasında room closed stateleri temizleniyor...');
      setIsRoomClosed(false);
      setRoomClosedReason('');
    };
  }, []);

  // Geri sayım için animasyon değeri - Component seviyesinde tanımlanmalı
  const countdownScale = useRef(new Animated.Value(1)).current;

  const handleProfanityWarning = (data) => {
    setChatWarning(data.message);
  };

  const handleMessageBlocked = (data) => {
    setChatBlocked(true);
    setChatBlockDuration(data.blockDuration);
  };

  // Socket bağlantısını ve roomClosed state'ini önce al - useEffect'lerden önce
  const { 
    socket, 
    room, 
    roomClosed, 
    setRoomClosed,
    gameState, 
    players, 
    currentTurn, 
    winner, 
    validMoves, 
    socketId,
    movePawn,
    chatMessages,
    sendMessage,
    onProfanityWarning,
    onMessageBlocked,
  } = useSocket({
    onProfanityWarning: handleProfanityWarning,
    onMessageBlocked: handleMessageBlocked
  });

  // Room ID değiştiğinde roomClosed state'ini sıfırla - DAHA GÜÇLÜ VERSİYON
  useEffect(() => {
    if (roomId && roomId !== previousRoomIdRef.current) {
      console.log(`[OnlineGame] Room ID değişti: ${previousRoomIdRef.current} -> ${roomId}, TÜM roomClosed state'leri sıfırlanıyor`);
      
      // Önceki room ID'yi güncelle
      previousRoomIdRef.current = roomId;
      
      // Room closed state'ini sıfırla - yeni odaya katılırken eski kapanma durumunu temizle
      if (roomClosed.isClosed) {
        console.log('[OnlineGame] Eski roomClosed state sıfırlanıyor');
        setRoomClosed({ isClosed: false, reason: '' });
      }
      
      // Local state'leri de sıfırla - HER DURUMDA
      console.log('[OnlineGame] Local roomClosed stateleri sıfırlanıyor');
      setIsRoomClosed(false);
      setRoomClosedReason('');
    }
  }, [roomId, roomClosed.isClosed, setRoomClosed]); 

  // Current user tanımlaması
  const currentUser = actualUser;

  // Güvenli navigation helper fonksiyonu
  const safeNavigateToHome = useCallback(() => {
    console.log('[safeNavigateToHome] Ana sayfaya yönlendirme deneniyor...');
    
    // Component hala mounted mı kontrol et
    if (!isMountedRef.current) {
      console.log('[safeNavigateToHome] Component unmounted, navigation iptal edildi');
      return;
    }
    
    // Navigation'ı dene - önce navigation.navigate, sonra router.replace
    try {
      // Önce navigation.navigate ile dene (daha güvenli)
      if (navigation && navigation.navigate) {
        navigation.navigate('home');
        console.log('[safeNavigateToHome] Navigation.navigate başarılı');
      } else if (router && router.replace) {
        // Navigation yoksa router.replace ile dene
        router.replace('/home');
        console.log('[safeNavigateToHome] Router.replace başarılı');
      } else {
        // Fallback: Try to use global navigation if available
        console.warn('[safeNavigateToHome] Neither navigation.navigate nor router.replace available');
        
        // Try using the global router object as last resort
        if (typeof globalThis !== 'undefined' && globalThis.router) {
          globalThis.router.replace('/home');
          console.log('[safeNavigateToHome] Global router.replace başarılı');
        } else {
          throw new Error('No navigation method available');
        }
      }
    } catch (error) {
      console.error('[safeNavigateToHome] Navigation hatası:', error);
      
      // Navigation hatası varsa kullanıcıyı uyar
      dispatch(showAlert({
        type: 'error',
        title: 'Gezinme Hatası',
        message: 'Ana sayfaya dönülemedi. Lütfen manuel olarak ana sayfaya dönün.'
      }));
      
      // Ekstra güvenlik: Hata durumunda navigation state'ini temizle
      try {
        if (navigation && navigation.reset) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'home' }],
          });
          console.log('[safeNavigateToHome] Navigation reset başarılı');
        } else if (navigation && navigation.popToTop) {
          navigation.popToTop();
          console.log('[safeNavigateToHome] Navigation popToTop başarılı');
        }
      } catch (resetError) {
        console.error('[safeNavigateToHome] Reset navigation da başarısız:', resetError);
      }
    }
  }, [router, navigation, dispatch]);

  // Multiplayer board burada açıldığı için navigation yapılmıyor.
  // useEffect(() => {
  //   // Oyun 'pre-game' veya 'playing' fazına geçtiğinde gameboard'a yönlendir
  //   const currentPhase = room?.phase || room?.gameState?.phase || gameState?.phase;
  //   if (room && room.id && (currentPhase === 'pre-game' || currentPhase === 'playing')) {
  //     router.replace(`/game/${room.id}`);
  //   }
  // }, [room, router, gameState?.phase]);

  // Geri sayım için socket olaylarını dinle
  useEffect(() => {
    if (!socket) return;

    const handleCountdownStarted = (data) => {
      console.log('[COUNTDOWN] Geri sayım başladı:', data);
      setTimeLeft(data.timeLeft);
    };

    const handleCountdownUpdate = (data) => {
      console.log('[COUNTDOWN] Geri sayım güncellendi:', data.timeLeft);
      setTimeLeft(data.timeLeft);
    };

    const handleCountdownStopped = () => {
      console.log('[COUNTDOWN] Geri sayım durduruldu');
      setTimeLeft(0);
    };

    socket.on('countdown_started', handleCountdownStarted);
    socket.on('countdown_update', handleCountdownUpdate);
    socket.on('countdown_stopped', handleCountdownStopped);

    return () => {
      socket.off('countdown_started', handleCountdownStarted);
      socket.off('countdown_update', handleCountdownUpdate);
      socket.off('countdown_stopped', handleCountdownStopped);
    };
  }, [socket]);

  // Energy check before game starts
  useEffect(() => {
    const checkEnergyAndStartGame = async () => {
      try {
        const hasEnergy = await EnergyService.hasEnoughEnergy();
        if (!hasEnergy) {
          router.replace('/(auth)/energy');
          return;
        }
        
        // Use energy when game starts
        await EnergyService.useEnergy();
        setEnergyChecked(true);
      } catch (error) {
        console.error('Energy check error:', error);
        router.replace('/(auth)/energy');
      }
    };

    if (!energyChecked) {
      checkEnergyAndStartGame();
    }
  }, [energyChecked, router]);

  // Check if current user is the room creator
  useEffect(() => {
    if (room && players && players.length > 0) {
      const firstPlayer = players[0];
      const amICreator = firstPlayer && (firstPlayer.id === actualUser?.id || firstPlayer.id === socket?.id);
      setIsCreator(amICreator);
      
      console.log('[COUNTDOWN DEBUG]', {
        amICreator,
        gamePhase,
        playersLength: players.length,
        timeLeft
      });
    }
  }, [room, players, actualUser?.id, socket?.id, gamePhase, timeLeft]);

  // Award diamond for winning online game
  useEffect(() => {
    if (gamePhase === 'finished' && winner && playersInfo && playersInfo[winner]) {
      const winnerInfo = playersInfo[winner];
      // Check if the current user is the winner
      if (winnerInfo.id === actualUser?.id || winnerInfo.id === socket?.id) {
        console.log(`Awarding 1 diamond to ${winnerInfo.nickname} for winning online game`);
        // Award 1 diamond for winning online game
        DiamondService.awardGameWin();
      }
    }
  }, [gamePhase, winner, playersInfo, actualUser?.id, socket?.id]);

  // Geri sayım animasyonu - Component seviyesinde
  useEffect(() => {
    if (timeLeft > 0 && timeLeft <= 10) {
      Animated.sequence([
        Animated.timing(countdownScale, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(countdownScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [timeLeft, countdownScale]);

  const gamePhase = room?.phase || room?.gameState?.phase || gameState?.phase || 'loading';
  const message = gameState?.message || '';

  const myColor = useMemo(() => {
    if (!players || !actualUser) return null;
    // Check for both user.id (for authenticated users) and socket.id (for guests/fallback)
    const myPlayer = players.find((p) => p.id === actualUser.id || p.id === socket.id);
    return myPlayer?.color;
  }, [players, actualUser, socket.id]);

  const isMyTurn = useMemo(() => {
  if (!gameState || !myColor) return false;
  return gameState.currentPlayer === myColor;
}, [gameState, myColor]);

  // Yapay zeka modunu kontrol et (sadece botlar varsa true)
  const isAIMode = useMemo(() => {
    if (!players || players.length === 0) return false;
    return players.every(player => player.isBot === true);
  }, [players]);
  
  const [showTurnPopup, setShowTurnPopup] = useState(false);
  const [popupAnim] = useState(new Animated.Value(0));

  // Zar atma butonu aktiflik mantığı
// Pre-game (sıralama turu) boyunca Zar At herkes için aktif
// Sadece oyun (playing) fazında, sıra kimdeyse onda aktif
const canRollDice = useMemo(() => {
  if (gamePhase === 'pre-game') {
    if (!myColor) {
      return false;
    }
    
    // Ensure turnOrderRolls is an array before checking
    const turnOrderRolls = gameState?.turnOrderRolls || [];
    
    // Check if player has already rolled - handle both array and object formats
    let playerHasRolled = false;
    if (Array.isArray(turnOrderRolls)) {
      playerHasRolled = turnOrderRolls.some(r => r.color === myColor);
    } else if (typeof turnOrderRolls === 'object') {
      // Handle case where turnOrderRolls might be an object from backend
      playerHasRolled = turnOrderRolls.hasOwnProperty(myColor);
    }
    
    return !playerHasRolled;
  }

  if (gamePhase === 'playing') {
    if (!isMyTurn) {
      return false;
    }
    
    const diceAvailable = gameState?.diceValue === null || gameState?.diceValue === undefined;
    return diceAvailable;
  }

  return false;
}, [gamePhase, myColor, isMyTurn, gameState?.turnOrderRolls, gameState?.diceValue]);




useEffect(() => {
  if (gameState?.currentPlayer && gamePhase === 'playing') {
    setShowTurnPopup(true);
    Animated.sequence([
      Animated.timing(popupAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(popupAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => setShowTurnPopup(false));
  }
}, [gameState?.currentPlayer, gamePhase]);

  // Chat mesajları için unread sayısını takip et
  const prevMessageCountRef = useRef(0);
  
  useEffect(() => {
    if (!isChatVisible && chatMessages && chatMessages.length > 0) {
      // Sadece yeni mesaj geldiğinde unread sayısını artır
      if (chatMessages.length > prevMessageCountRef.current) {
        const lastMessage = chatMessages[chatMessages.length - 1];
        if (lastMessage && lastMessage.userId !== actualUser?.id) {
          setUnreadMessageCount(prev => prev + 1);
        }
      }
    }
    prevMessageCountRef.current = chatMessages?.length || 0;
  }, [chatMessages, isChatVisible, currentUser]);

  // Chat açıldığında unread sayısını sıfırla
  useEffect(() => {
    if (isChatVisible) {
      setUnreadMessageCount(0);
    }
  }, [isChatVisible]);

  // Socket bağlantı durumunu izle ve bağlantı koparsa kullanıcıyı bilgilendir
  useEffect(() => {
    if (!socket || !isMountedRef.current) return;

    const handleDisconnect = () => {
      console.log('[onlineGame] Socket bağlantısı kesildi, güvenli çıkış yapılıyor');
      // Navigation'ı güvenli bir şekilde yap - mounting tamamlandıktan sonra
      setTimeout(() => {
        safeNavigateToHome();
      }, 500); // Daha uzun gecikme ile navigation'ı dene
    };

    // Socket bağlantısı kesilirse - sadece aktif bağlantı durumunda
    if (socket.disconnected && socket.connected !== undefined) {
      handleDisconnect();
    }

    // Socket olaylarını dinle
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, router]);

  // Socket yeniden bağlanma olaylarını yönet
  useEffect(() => {
    if (!socket) return;

    let reconnectTimeout;
    let alertShown = false;

    // Handle successful dice rolls
    const handleRollSuccess = (data) => {
      console.log('[Roll Success] Dice roll successful:', data);
      // Visual feedback removed for cleaner gameplay
    };

    const handleRoomClosed = (data) => {
      console.log('[Room Closed] Oda kapatıldı:', data);
      setRoomClosed({ isClosed: true, reason: data.reason });
    };

    const handlePlayerLeft = (data) => {
      console.log('[Player Left] Oyuncu ayrıldı:', data);
      
      // Eğer kalan insan oyuncu sayısı 0 ise oyunu sonlandır
      if (data.remainingHumanPlayers === 0) {
        setRoomClosed({ isClosed: true, reason: 'Tüm oyuncular ayrıldı' });
      } else {
        // Sadece bilgilendirme mesajı göster
        dispatch(showAlert({
          type: 'info',
          title: 'Oyuncu Ayrıldı',
          message: `${data.playerNickname} oyundan ayrıldı. Geriye kalan insan oyuncular: ${data.remainingHumanPlayers}`
        }));
      }
    };

    const handleDisconnect = (reason) => {
      console.log(`[Socket Disconnect] Bağlantı kesildi: ${reason}`);
      
      // Otomatik yeniden bağlanma için timeout
      if (reason === 'ping timeout' || reason === 'transport close' || reason === 'transport error') {
        reconnectTimeout = setTimeout(() => {
          if (socket && !socket.connected) {
            console.log('[Socket] Otomatik yeniden bağlanma deneniyor...');
            socket.connect();
          }
        }, 2000);
      }

      // Sadece kritik bağlantı hatalarını göster
      if (!alertShown) {
        alertShown = true;
        
        if (reason === 'io server disconnect') {
          // Sunucu tarafından kesilen bağlantılar sessizce yeniden bağlanır
          console.log('Sunucu bağlantısı kesildi, sessizce yeniden bağlanılıyor...');
        }
      }
    };

    const handleConnectError = (error) => {
      console.error(`[Socket Connect Error] Bağlantı hatası: ${error.message}`);
      
      // Bağlantı hataları sessizce loglanır, kullanıcıya gösterilmez
      if (error.message.includes('xhr poll error')) {
        console.log('Ağ bağlantısı yok, otomatik yeniden denenecek');
      } else if (error.message.includes('timeout')) {
        console.log('Bağlantı zaman aşımı, otomatik yeniden denenecek');
      } else {
        console.log('Bağlantı hatası, otomatik yeniden denenecek');
      }
    };

    const handleConnect = () => {
      console.log('[Socket Connect] Bağlantı kuruldu');
      alertShown = false; // Bağlantı kurulduğunda alert flag'ini sıfırla
      
      // Bağlantı kurulduğunda odaya tekrar katılmayı dene
      if (room?.id) {
        const currentPhase = room?.phase || room?.gameState?.phase || gameState?.phase;
        if (currentPhase !== 'waiting') {
          console.log('[Socket] Bağlantı kuruldu, odaya tekrar katılmayı deneyin');
        }
      }
    };

    const handleReconnect = (attemptNumber) => {
      console.log(`[Socket] Yeniden bağlandı (deneme: ${attemptNumber})`);
      alertShown = false;
    };

    const handleReconnectAttempt = (attemptNumber) => {
      console.log(`[Socket] Yeniden bağlanma denemesi: ${attemptNumber}`);
    };

    const handleReconnectFailed = () => {
      console.error('[Socket] Tüm yeniden bağlanma denemeleri başarısız');
      // Kullanıcıya gösterilmeyecek, sadece loglanacak
    };

    const handleError = (error) => {
      console.error('[Socket Error] Server error received:', error);
      
      if (error && error.type) {
        switch (error.type) {
          case 'ROOM_NOT_FOUND':
            dispatch(showAlert({
              type: 'error',
              title: 'Oda Bulunamadı',
              message: error.message || 'Oda bulunamadı. Lütfen tekrar katılmayı deneyin.'
            }));
            break;
          case 'PLAYER_NOT_FOUND':
            dispatch(showAlert({
              type: 'error',
              title: 'Oyuncu Bulunamadı',
              message: error.message || 'Oyuncu bilgisi bulunamadı.'
            }));
            break;
          case 'WRONG_PHASE':
            dispatch(showAlert({
              type: 'warning',
              title: 'Yanlış Oyun Aşaması',
              message: error.message || 'Bu işlem şu anda yapılamaz.'
            }));
            break;
          case 'NOT_YOUR_TURN':
            dispatch(showAlert({
              type: 'warning',
              title: 'Sıra Sizde Değil',
              message: error.message || 'Şu anda sıra sizde değil.'
            }));
            break;
          case 'ALREADY_ROLLED':
            dispatch(showAlert({
              type: 'warning',
              title: 'Zar Atıldı',
              message: error.message || 'Bu turda zaten zar attınız.'
            }));
            break;
          case 'DICE_ROLL_ERROR':
            dispatch(showAlert({
              type: 'error',
              title: 'Zar Atma Hatası',
              message: error.message || 'Zar atılırken bir hata oluştu. Lütfen tekrar deneyin.'
            }));
            break;
          case 'INVALID_REQUEST':
            dispatch(showAlert({
              type: 'error',
              title: 'Geçersiz İstek',
              message: error.message || 'Geçersiz istek. Lütfen tekrar deneyin.'
            }));
            break;
          default:
            dispatch(showAlert({
              type: 'error',
              title: 'Sunucu Hatası',
              message: error.message || 'Beklenmeyen bir hata oluştu.'
            }));
        }
      }
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('connect', handleConnect);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_failed', handleReconnectFailed);
    socket.on('error', handleError);
    socket.on('roll_success', handleRollSuccess);
    socket.on('room_closed', handleRoomClosed);
    socket.on('player_left', handlePlayerLeft);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('connect', handleConnect);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect_failed', handleReconnectFailed);
      socket.off('error', handleError);
      socket.off('roll_success', handleRollSuccess);
      socket.off('room_closed', handleRoomClosed);
      socket.off('player_left', handlePlayerLeft);
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [socket, dispatch, room, gameState]);

  const popupStyle = {
    opacity: popupAnim,
    transform: [{ translateY: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  };
  


  const playersInfo = useMemo(() => {
    if (!players || !players.length) return {};
    return players.reduce((acc, player) => {
      if (player && player.color) {
        acc[player.color] = player;
      }
      return acc;
    }, {});
  }, [players]);

  const currentPlayerInfo = useMemo(() => {
    if (!gameState?.currentPlayer || !players.length) return null;
    return players.find(p => p.color === gameState.currentPlayer);
  }, [gameState?.currentPlayer, players]);

  const renderTurnOrderRolls = () => {
    // Handle both array and object formats
    const turnOrderRolls = gameState?.turnOrderRolls || [];
    let rollsArray = [];
    
    if (Array.isArray(turnOrderRolls)) {
      rollsArray = turnOrderRolls;
    } else if (typeof turnOrderRolls === 'object') {
      // Convert object format to array format
      rollsArray = Object.entries(turnOrderRolls).map(([color, rollData]) => ({
        color,
        roll: rollData.diceValue || rollData.roll || 0,
        nickname: rollData.nickname || playersInfo[color]?.nickname || '...'
      }));
    }
    
    return (
      <View style={styles.turnOrderContainer}>
        <Text style={styles.turnOrderTitle}>Sıralama için zar atın!</Text>
        <View style={styles.turnOrderList}>
          {rollsArray.map((roll, index) => (
            <View key={index} style={styles.turnOrderItem}>
              <View style={styles.playerInfoRow}>
                <View style={[styles.playerColorBox, { backgroundColor: COLORS[roll.color] }]} />
                <Text style={styles.playerName}>{playersInfo[roll.color]?.nickname || '...'}</Text>
              </View>
              <Text style={styles.playerRoll}>{roll.roll}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };



  useEffect(() => {
    if (roomClosed.isClosed && !hasNavigatedRef.current) {
      const timer = setTimeout(() => {
        // Eğer zaten navigation yapıldıysa tekrar yapma
        if (hasNavigatedRef.current) {
          console.log('[Navigation] Zaten navigation yapıldı, tekrar yapılmıyor');
          return;
        }
        
        // Navigation flag'ini işaretle
        hasNavigatedRef.current = true;
        console.log('[Navigation] Room closed navigation başlatılıyor');
        
        // Oda kapatıldığında doğrudan ana sayfaya yönlendir
        try {
          router.replace('/(auth)/home');
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback navigation
          router.push('/(auth)/home');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [roomClosed, router]);

  useEffect(() => {
    let unsubscribe;
    let backHandlerSubscription;
    const onBack = () => true; 

    if (gamePhase === 'waiting' || gamePhase === 'pre-game') {
      backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBack);
      unsubscribe = navigation.addListener('beforeRemove', e => e.preventDefault());
      navigation.setOptions?.({ gestureEnabled: false });
    } else {
      if (backHandlerSubscription) {
        backHandlerSubscription.remove();
      }
      if (unsubscribe) unsubscribe();
      navigation.setOptions?.({ gestureEnabled: true });
    }

    return () => {
      if (backHandlerSubscription) {
        backHandlerSubscription.remove();
      }
      if (unsubscribe) unsubscribe();
    };
  }, [gamePhase, navigation]);

  // Room closed durumunu güncelle - DAHA GÜÇLÜ VERSİYON
  useEffect(() => {
    if (roomClosed.isClosed) {
      console.log('[OnlineGame] Room closed detected, setting isRoomClosed to true');
      setIsRoomClosed(true);
      setRoomClosedReason(roomClosed.reason);
    } else {
      // Room closed değilse, local state'i de temizle
      console.log('[OnlineGame] Room is not closed, ensuring local state is clean');
      setIsRoomClosed(false);
      setRoomClosedReason('');
    }
  }, [roomClosed]);

  const renderWaitingOverlay = () => {
  const maxPlayers = 4;
  const currentPlayers = players || [];
  const missingPlayers = maxPlayers - currentPlayers.length;
  
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.overlay}
    >
      <View style={styles.waitingContainer}>
        {/* Üst başlık */}
        <Animated.View style={[styles.titleContainer, { transform: [{ scale: countdownScale }] }]}>
          <Text style={styles.waitingTitle}>OYUN BAŞLIYOR</Text>
          <View style={styles.titleUnderline} />
        </Animated.View>
        
        {/* Geri sayım göstergesi */}
        {timeLeft > 0 && (
          <View style={styles.countdownContainer}>
            <Animated.View style={[styles.countdownCircle, { transform: [{ scale: countdownScale }] }]}>
              <Text style={styles.countdownNumber}>{timeLeft}</Text>
            </Animated.View>
            <Text style={styles.countdownText}>saniye</Text>
          </View>
        )}
        
        {/* Oyuncular grid */}
        <View style={styles.playersGrid}>
          {[0, 1, 2, 3].map((index) => {
            const player = currentPlayers[index];
            const isOccupied = player !== undefined;
            
            return (
              <View key={index} style={[
                styles.playerSlot,
                isOccupied && styles.playerSlotOccupied,
                !isOccupied && styles.playerSlotEmpty
              ]}>
                {isOccupied ? (
                  <>
                    <View style={[
                      styles.playerColorIndicator,
                      { backgroundColor: COLORS[player.color] }
                    ]} />
                    <Text style={styles.playerName} numberOfLines={1}>
                      {player.nickname || 'Oyuncu'}
                    </Text>
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.playerStatusIcon} />
                  </>
                ) : (
                  <>
                    <View style={styles.emptySlotIcon}>
                      <Ionicons name="person-add" size={24} color="#666" />
                    </View>
                    <Text style={styles.emptySlotText}>Bekleniyor...</Text>
                  </>
                )}
              </View>
            );
          })}
        </View>
        
        {/* Durum mesajı */}
        <View style={styles.statusMessageContainer}>
          {currentPlayers.length === 0 ? (
            <Text style={styles.statusText}>Bağlantı kuruluyor...</Text>
          ) : missingPlayers > 0 ? (
            <>
              <Text style={styles.statusText}>
                {missingPlayers} oyuncu daha bekleniyor...
              </Text>
              {isCreator && (
                <Text style={styles.creatorText}>
                  Oda kurucusu olarak oyunu başlatabilirsin
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.readyText}>Tüm oyuncular hazır!</Text>
          )}
        </View>
        
        {/* Alt animasyon */}
        <LottieView
          source={require('../../assets/animations/loading-online-players.json')}
          style={styles.bottomAnimation}
          autoPlay
          loop
        />
      </View>
    </LinearGradient>
  );
};



  const renderPlayerInfo = () => {
    const getPlayerStatus = (playerColor) => {
      if (gamePhase === 'finished') return winner === playerColor ? "Kazandı!" : "Kaybetti";
      if (gameState?.currentPlayer === playerColor) return "Sıra Sizde";
      return "Sıra Rakipte";
    };

    return (
      <View style={styles.playerInfoContainer}>
        {players.map(player => (
          <View key={player.color} style={styles.playerInfo}>
            <View style={[styles.playerColorIndicator, { backgroundColor: COLORS[player.color] }]} />
            <Text style={styles.playerNickname}>{player.nickname}</Text>
            <Text style={styles.playerStatus}>{getPlayerStatus(player.color)}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Kazanan modalını kapatma ve ana menüye gitme fonksiyonu
  const handleWinnerModalClose = async () => {
    // Eğer zaten navigation yapıldıysa tekrar yapma
    if (hasNavigatedRef.current) {
      console.log('[Navigation] Zaten navigation yapıldı, winner navigation atlanıyor');
      return;
    }
    
    // Navigation flag'ini işaretle
    hasNavigatedRef.current = true;
    console.log('[Navigation] Winner modal navigation başlatılıyor');
    
    try {
      // Reklam göster
      await AdService.showInterstitialAd();
    } catch (error) {
      console.error('Reklam gösterme hatası:', error);
    } finally {
      // Ana menüye git - güvenli navigation
      setTimeout(() => {
        if (!isMounted) return;
        try {
          router.replace('/(auth)/home');
        } catch (error) {
          console.error('Navigation error in handleWinnerModalClose:', error);
          try {
            router.push('/(auth)/home');
          } catch (pushError) {
            console.error('Push navigation da başarısız:', pushError);
          }
        }
      }, 100);
    }
  };

  // Winner alert göster
  const showWinnerAlert = useCallback(() => {
    if (gamePhase === 'finished' && winner) {
      const isWinner = isCurrentUserWinner();
      
      Alert.alert(
        isWinner ? 'Tebrikler!' : 'Oyun Bitti',
        winner && playersInfo && playersInfo[winner] ? 
          `${playersInfo[winner].nickname} kazandı!${isWinner ? "\n+10 Puan!\n+1 💎" : "\nDaha iyi şanslar!"}` : 
          'Oyun bitti!',
        [
          {
            text: 'Ana Menü',
            style: 'default',
            onPress: handleWinnerModalClose
          }
        ]
      );
    }
  }, [gamePhase, winner, playersInfo, dispatch, handleWinnerModalClose]);

  // Kazanan oyuncunun gerçek kullanıcı olup olmadığını kontrol et
  const isCurrentUserWinner = () => {
    if (!winner || !playersInfo || !playersInfo[winner]) return false;
    const winnerInfo = playersInfo[winner];
    return winnerInfo.id === actualUser?.id || winnerInfo.id === socket?.id;
  };

  // Winner alert'ı otomatik göster - güvenli navigation
  useEffect(() => {
    if (gamePhase === 'finished' && winner) {
      showWinnerAlert();
    }
  }, [gamePhase, winner, showWinnerAlert]);



  // --- Pawn selection logic for multiplayer, mirrors AI mode ---
  const handlePawnPress = (pawnIndex, position) => {
    if (!isMyTurn || !room?.gameState?.diceValue || !room?.gameState?.validMoves) return;

    console.log(`[CLIENT LOG] Pawn clicked. Index: ${pawnIndex}, Position: ${position}`);
    console.log('[CLIENT LOG] Valid moves received from server:', JSON.stringify(room.gameState.validMoves, null, 2));

    // Correctly find the move using the pawn's index and current position.
    const chosenMove = room.gameState.validMoves.find(
      (move) => move.pawnIndex === pawnIndex && move.from === position
    );

    if (chosenMove) {
      const moveData = { roomId: room.id, move: chosenMove };
      console.log('[CLIENT LOG] Pawn is valid. Sending `move_pawn` event with data:', JSON.stringify(moveData, null, 2));
      socket.emit('move_pawn', moveData);
    } else {
      console.log('[CLIENT LOG] Clicked pawn is not in the list of valid moves.');
    }
  };

  const handleLeaveGame = () => {
    Alert.alert(
      'Oyundan Ayrıl',
      "Oyunu bırakıp ana menüye dönmek istediğinizden emin misiniz?",
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: () => {
            console.log('[Leave Game] Oyuncu oyundan ayrılmak istiyor.');
            
            // ÖNEMLİ: Room closed state'lerini temizle - yeni oda kurarken sorun olmaması için
            console.log('[Leave Game] Room closed stateleri temizleniyor...');
            setIsRoomClosed(false);
            setRoomClosedReason('');
            if (roomClosed.isClosed) {
              setRoomClosed({ isClosed: false, reason: '' });
            }
            
            // Eğer zaten navigation yapıldıysa tekrar yapma
            if (hasNavigatedRef.current) {
              console.log('[Navigation] Zaten navigation yapıldı, leave game atlanıyor');
              return;
            }
            
            // Navigation flag'ini işaretle
            hasNavigatedRef.current = true;
            console.log('[Navigation] Leave game navigation başlatılıyor');
            
            // Navigation'ı bir sonraki event loop cycle'a ertele
            // Bu, Alert modal'ının tamamen kapanmasını sağlar
            setTimeout(async () => {
              try {
                // Odadan ayrılmayı dene - socket bağlantısı yoksa bile devam et
                if (socket && room?.id) {
                  console.log(`[Leave Game] Leaving room: ${room.id}`);
                  
                  // Socket bağlı değilse bağlanmayı dene
                  if (!socket.connected) {
                    console.log('[Leave Game] Socket not connected, attempting to connect...');
                    socket.connect();
                    
                    // Bağlantı kurulmasını bekle
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                  
                  // Socket şimdi bağlıysa leave_room gönder
                  if (socket.connected) {
                    socket.emit('leave_room', { roomId: room.id });
                    console.log('[Leave Game] Leave room emitted successfully');
                    
                    // Sunucunun işlemesi için kısa bir süre bekle
                    await new Promise(resolve => setTimeout(resolve, 300));
                  } else {
                    console.warn('[Leave Game] Socket still not connected, proceeding with navigation anyway');
                  }
                } else {
                  console.warn('[Leave Game] No socket or room available, proceeding with navigation');
                }
                
                // Her durumda navigation'a devam et - odadan ayrılmak başarısız olsa bile
                console.log('[Leave Game] Proceeding to home screen...');
                setTimeout(() => {
                  if (isMountedRef.current) {
                    safeNavigateToHome();
                  } else {
                    console.warn('[Leave Game] Component unmounted, skipping navigation');
                  }
                }, 100);
                
              } catch (error) {
                console.error('[Leave Game] Error during leave process:', error);
                // Hata durumunda bile navigation'a devam et
                setTimeout(() => {
                  if (isMountedRef.current) {
                    safeNavigateToHome();
                  }
                }, 100);
              }
            }, 0);
          }
        }
      ]
    );
  };

  const rollDiceForTurnOrder = () => {
    console.log('[ACTION] rollDiceForTurnOrder fonksiyonu çağrıldı.');
    console.log('[ACTION] Socket bağlantısı var mı?:', !!socket);
    console.log('[ACTION] Socket connected?:', socket?.connected);
    console.log('[ACTION] Oda ID:', room?.id);
    console.log('[ACTION] myColor:', myColor);
    console.log('[ACTION] canRollDice:', canRollDice);
    console.log('[ACTION] gamePhase:', gamePhase);
    console.log('[ACTION] turnOrderRolls:', gameState?.turnOrderRolls);
    
    if (!socket) {
      console.error('[HATA] Zar atılamadı. Socket yok.');
      dispatch(showAlert({
        type: 'error',
        title: 'Bağlantı Hatası',
        message: 'Sunucuya bağlantı yok. Lütfen tekrar bağlanmayı deneyin.'
      }));
      return;
    }
    
    if (!socket.connected) {
      console.error('[HATA] Zar atılamadı. Socket bağlantısı kopuk.');
      dispatch(showAlert({
        type: 'error',
        title: 'Bağlantı Hatası',
        message: 'Sunucu bağlantısı kesildi. Yeniden bağlanılıyor...'
      }));
      socket.connect();
      return;
    }
    
    if (!room?.id) {
      console.error('[HATA] Zar atılamadı. Oda ID eksik.');
      dispatch(showAlert({
        type: 'error',
        title: 'Oda Hatası',
        message: 'Oda bilgisi bulunamadı. Lütfen tekrar odaya katılın.'
      }));
      return;
    }
    
    if (!canRollDice) {
      console.error('[HATA] Zar atılamadı. Zar atma koşulları uygun değil.');
      dispatch(showAlert({
        type: 'warning',
        title: 'Zar Atılamaz',
        message: 'Şu anda zar atamazsınız. Sıra sizde değil veya zaten attınız.'
      }));
      return;
    }
    
    console.log(`[ACTION] Sunucuya 'roll_dice_turn_order' gönderiliyor. Oda: ${room.id}`);
    socket.emit('roll_dice_turn_order', { roomId: room.id });
    
    // Disable dice button temporarily to prevent spam
    setTimeout(() => {
      console.log('[ACTION] Zar atma butonu tekrar aktif edildi.');
    }, 1000);
  };

  const rollDiceRegular = () => {
    if (socket && isMyTurn && room?.id) {
      console.log(`[ACTION] Sunucuya 'roll_dice' gönderiliyor. Oda: ${room.id}`);
      socket.emit('roll_dice', { roomId: room.id });
    } else {
       console.error('[HATA] Zar atılamadı. Socket, sıra veya oda ID eksik.', {
        socketMevcut: !!socket,
        isMyTurn,
        odaId: room?.id
      });
    }
  };



  return (
    <ImageBackground 
      source={require('../../assets/images/wood-background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {isRoomClosed ? (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>
              {roomClosedReason?.includes('kurucusu') 
                ? 'Oda kurucusu ayrıldı, oyun sona eriyor...' 
                : roomClosedReason?.includes('insan')
                ? 'Tüm oyuncular ayrıldı, oda kapatılıyor...'
                : 'Oda kapatılıyor...'
              }
            </Text>
          </View>
        ) : (
          <>
            {showTurnPopup && (
              <Animated.View style={[styles.turnPopup, popupStyle]}>
                <Text style={styles.turnPopupText}>{"Sıra Sende!"}</Text>
              </Animated.View>
            )}

        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.turnText}>
              {gamePhase === 'pre-game'
                ? "Sıra Belirleme Turu"
                : `Sıra: ${playersInfo && gameState?.currentPlayer && (playersInfo[gameState.currentPlayer]?.nickname || '...')}`}
            </Text>
            <View style={[styles.turnColorBox, { backgroundColor: COLORS[gameState?.currentPlayer] || '#888' }]} />
          </View>
          {!isAIMode && (
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => {
                console.log('Chat button pressed, current state:', isChatVisible);
                setIsChatVisible(!isChatVisible);
              }}
            >
              <Ionicons name="chatbubble-outline" size={24} color="white" />
              {unreadMessageCount > 0 && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>
                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {(gamePhase === 'waiting' || (gamePhase !== 'finished' && (!players || players.length < 4))) && renderWaitingOverlay()}

        {(gamePhase === 'pre-game' || gamePhase === 'playing' || gamePhase === 'finished') && (
          <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
            <OnlineGameBoard
              players={room.players}
              gameState={room.gameState}
              diceValue={room.gameState.diceValue}
              onPawnPress={(pawnIndex, position) => handlePawnPress(pawnIndex, position)}
              currentPlayer={room.gameState.currentPlayer}
              validMoves={room.gameState.validMoves}
              myColor={myColor}
              isMyTurn={isMyTurn}
              style={styles.gameBoard}
              playersInfo={playersInfo}
            />

            <View style={styles.controlsContainer}>
              {/* Show turn order rolls in pre-game, or the game message otherwise */}
              {gamePhase === 'pre-game' 
                ? renderTurnOrderRolls()
                : (
                  <View style={styles.messageContainer}>
                    <Text style={styles.gameMessage}>{message || ' '}</Text>
                  </View>
                )
              }

              {/* Dice and Roll Button Area */}
              <View style={styles.diceAndButtonContainer}>
                {/* The Dice itself, shown in 'playing' phase when there's a value, or in 'pre-game' phase when current player has rolled */}
                {((gamePhase === 'playing' && gameState?.diceValue) || 
                  (gamePhase === 'pre-game' && gameState?.turnOrderRolls && myColor && (() => {
                    const turnOrderRolls = gameState.turnOrderRolls;
                    if (Array.isArray(turnOrderRolls)) {
                      return turnOrderRolls.some(roll => roll.color === myColor);
                    } else if (typeof turnOrderRolls === 'object') {
                      return turnOrderRolls.hasOwnProperty(myColor);
                    }
                    return false;
                  })())) && 
                  <Dice number={
                    gamePhase === 'playing' 
                      ? gameState?.diceValue 
                      : (() => {
                        const turnOrderRolls = gameState.turnOrderRolls;
                        if (Array.isArray(turnOrderRolls)) {
                          const roll = turnOrderRolls.find(roll => roll.color === myColor);
                          return roll ? roll.roll : 0;
                        } else if (typeof turnOrderRolls === 'object') {
                          const rollData = turnOrderRolls[myColor];
                          return rollData ? (rollData.diceValue || rollData.roll || 0) : 0;
                        }
                        return 0;
                      })()
                  } />}
                
                {/* The Roll Dice button container */}
                <View style={styles.controls}>
                  {gamePhase !== 'finished' && (
                    <TouchableOpacity
                      onPress={gamePhase === 'pre-game' ? rollDiceForTurnOrder : rollDiceRegular}
                      disabled={!canRollDice}
                      style={[styles.actionButton, !canRollDice && styles.disabledButton]}
                    >
                      <Text style={styles.actionButtonText}>Zar At</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Footer Buttons */}
              <View style={styles.footerButtonsContainer}>
                <TouchableOpacity onPress={handleLeaveGame} style={styles.footerButton}>
                  <Text style={styles.footerButtonText}>Oyundan Ayrıl</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Chat Component */}
            {!isAIMode && (
              <ChatComponent
                isVisible={isChatVisible}
                onToggle={() => {
                  console.log('Chat toggle pressed, current state:', isChatVisible);
                  setIsChatVisible(!isChatVisible);
                }}
                messages={chatMessages || []}
                onSendMessage={sendMessage}
                currentUser={{ id: actualUser?.id, nickname: actualUser?.nickname }}
                warningMessage={chatWarning}
                isBlocked={chatBlocked}
                blockDuration={chatBlockDuration}
                onProfanityWarning={handleProfanityWarning}
                onMessageBlocked={handleMessageBlocked}
              />
            )}
          </View>
        )}
          </>
        )}
            
        </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 10,
    paddingTop: Platform.OS === 'android' ? getStatusBarHeight() + 10 : 10, // Android'de status bar yüksekliği kadar padding
    justifyContent: getContainerJustifyContent(), // Ekran boyutuna göre ortala veya üstten başla
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  chatButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  chatBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  chatBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  turnText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 10,
    color: 'white',
  },
  turnColorBox: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  gameBoard: {
    width: '95%',
    aspectRatio: 1,
    maxWidth: getBoardSize(),
    maxHeight: getBoardSize(),
    alignSelf: 'center', // Center the board
  },
  controlsContainer: {
    width: '95%',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
  },
  messageContainer: {
    minHeight: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gameMessage: {
    fontSize: 16,
    color: 'white',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  diceAndButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 80,
  },
  controls: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  aiThinkingText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#ccc',
  },
  actionButton: {
    width: 120,
    height: 50,
    backgroundColor: '#0d6efd',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  aiThinkingText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#ccc',
  },
  actionButton: {
    width: 120,
    height: 50,
    backgroundColor: '#0d6efd',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  footerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    width: '100%',
  },
  footerButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  footerButtonText: {
    color: '#eee',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rollsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 5,
    marginBottom: 10,
  },
  rollInfoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  popupContainer: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  popupText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  moveHistoryContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  moveHistoryText: {
    color: '#fff',
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 2,
    marginLeft: 2,
  },
  turnOrderContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  turnOrderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  turnOrderList: {
    width: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 10,
  },
  turnOrderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  playerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerColorBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  playerName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  playerRoll: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // Her şeyin üzerinde olmasını garantiler
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  turnPopup: {
    position: 'absolute',
    top: '15%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  turnPopupText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsWonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
    marginBottom: 5,
  },
  diamondWonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  loseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 5,
    marginBottom: 10,
  },
  // YENİ GEÇİŞ EKRANI STİLLERİ
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  waitingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleUnderline: {
    width: 100,
    height: 3,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    marginTop: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 4,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  countdownText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 10,
    textAlign: 'center',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    marginBottom: 30,
  },
  playerSlot: {
    width: 90,
    height: 90,
    borderRadius: 15,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#444',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playerSlotOccupied: {
    borderStyle: 'solid',
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  playerSlotEmpty: {
    opacity: 0.7,
  },
  playerColorIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
    maxWidth: 80,
  },
  playerStatusIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptySlotIcon: {
    marginBottom: 8,
  },
  emptySlotText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  statusMessageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 8,
  },
  creatorText: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  readyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    textShadowColor: 'rgba(76, 175, 80, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  bottomAnimation: {
    width: 150,
    height: 150,
    opacity: 0.7,
  },
});

export default OnlineGameScreen;
