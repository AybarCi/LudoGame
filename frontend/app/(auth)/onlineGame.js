import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../store/AuthProvider';
import { BackHandler, Dimensions } from 'react-native';
import {
  ImageBackground,
  SafeAreaView,
  Text,
  StyleSheet,
  Modal,
  Animated,
  View,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import OnlineGameBoard from '../../components/modules/OnlineGameBoard';
import Dice from '../../components/shared/Dice';
import ChatComponent from '../../components/modules/ChatComponent';

import { useSocket } from '../../store/SocketProvider';
import { COLORS } from '../../constants/game';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiamondService } from '../../services/DiamondService';

const { width, height } = Dimensions.get('window');

const OnlineGameScreen = () => {
  const { user } = useAuth();
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

  const handleProfanityWarning = (data) => {
    setChatWarning(data.message);
  };

  const handleMessageBlocked = (data) => {
    setChatBlocked(true);
    setChatBlockDuration(data.blockDuration);
  };

  const { 
    socket, 
    room, 
    roomClosed, 
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

  // Current user tanımlaması
  const currentUser = user;

  // Multiplayer board burada açıldığı için navigation yapılmıyor.
  // useEffect(() => {
  //   // Oyun 'pre-game' veya 'playing' fazına geçtiğinde gameboard'a yönlendir
  //   const currentPhase = room?.phase || room?.gameState?.phase || gameState?.phase;
  //   if (room && room.id && (currentPhase === 'pre-game' || currentPhase === 'playing')) {
  //     router.replace(`/game/${room.id}`);
  //   }
  // }, [room, router, gameState?.phase]);

  // Check if current user is the room creator and start countdown
  useEffect(() => {
    if (room && players && players.length > 0) {
      const firstPlayer = players[0];
      const amICreator = firstPlayer && (firstPlayer.id === user?.id || firstPlayer.id === socket?.id);
      setIsCreator(amICreator);
      
      console.log('[COUNTDOWN DEBUG]', {
        amICreator,
        gamePhase,
        playersLength: players.length,
        timeLeft,
        shouldStartCountdown: amICreator && gamePhase === 'waiting' && players.length < 4
      });
      
      // Start countdown only for room creator and only in waiting phase
      if (amICreator && gamePhase === 'waiting') {
        console.log('[COUNTDOWN] Starting countdown timer');
        const interval = setInterval(() => {
          setTimeLeft(prev => {
            console.log('[COUNTDOWN] Timer tick:', prev - 1);
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => {
          console.log('[COUNTDOWN] Clearing countdown timer');
          clearInterval(interval);
        };
      } else if (gamePhase !== 'waiting') {
        console.log('[COUNTDOWN] Resetting timer, game phase changed to:', gamePhase);
        setTimeLeft(20); // Reset timer when game starts
      }
    }
  }, [room, players, user?.id, socket?.id, gamePhase]);

  // Award diamond for winning online game
  useEffect(() => {
    if (gamePhase === 'finished' && winner && playersInfo && playersInfo[winner]) {
      const winnerInfo = playersInfo[winner];
      // Check if the current user is the winner
      if (winnerInfo.id === user?.id || winnerInfo.id === socket?.id) {
        console.log(`Awarding 1 diamond to ${winnerInfo.nickname} for winning online game`);
        // Award 1 diamond for winning online game
        DiamondService.awardGameWin();
      }
    }
  }, [gamePhase, winner, playersInfo, user?.id, socket?.id]);

  const gamePhase = room?.phase || room?.gameState?.phase || gameState?.phase || 'loading';
  const message = gameState?.message || '';

  const myColor = useMemo(() => {
    if (!players || !user) return null;
    // Check for both user.id (for authenticated users) and socket.id (for guests/fallback)
    const myPlayer = players.find((p) => p.id === user.id || p.id === socket.id);
    return myPlayer?.color;
  }, [players, user, socket.id]);

  const isMyTurn = useMemo(() => {
  if (!gameState || !myColor) return false;
  const result = gameState.currentPlayer === myColor;
  console.log('[DEBUG][IS_MY_TURN]', {
    userId: user?.id,
    socketId: socket?.id,
    myColor,
    currentPlayer: gameState.currentPlayer,
    players: players?.map(p => ({id: p.id, color: p.color, nickname: p.nickname})),
    result
  });
  return result;
}, [gameState, myColor, user?.id, socket?.id, players]);
  
  const [showTurnPopup, setShowTurnPopup] = useState(false);
  const [popupAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    console.log('--- DEBUG: Centralized State Update ---');
    console.log('Is My Turn:', isMyTurn);
    console.log('My Color:', myColor);
    console.log('Game Phase:', gamePhase);
    console.log('room?.phase:', room?.phase);
    console.log('room?.gameState?.phase:', room?.gameState?.phase);
    console.log('gameState?.phase:', gameState?.phase);
    console.log('Current Player:', gameState?.currentPlayer);
    console.log('Socket ID:', socket?.id);
    console.log('Players Count:', players?.length);
    console.log('Players:', players?.map(p => ({ id: p.id, color: p.color, nickname: p.nickname, isBot: p.isBot })));
    console.log('Will show GameBoard:', (gamePhase === 'pre-game' || gamePhase === 'playing' || gamePhase === 'finished'));
    console.log('Will show WaitingOverlay:', (gamePhase === 'waiting' || (players && players.length < 4)));
    console.log('---------------------------------');
  }, [isMyTurn, myColor, gamePhase, room?.phase, room?.gameState?.phase, gameState?.phase, gameState?.currentPlayer, socket?.id, players]);

  // Zar atma butonu aktiflik mantığı
// Pre-game (sıralama turu) boyunca Zar At herkes için aktif
// Sadece oyun (playing) fazında, sıra kimdeyse onda aktif
const canRollDice = useMemo(() => {
  if (gamePhase === 'pre-game') {
    if (!myColor) return false;
    const playerHasRolled = gameState?.turnOrderRolls?.some(r => r.color === myColor);
    return !playerHasRolled;
  }

  if (gamePhase === 'playing') {
    if (!isMyTurn) return false;
    return gameState?.diceValue === null || gameState?.diceValue === undefined;
  }

  return false;
}, [gamePhase, myColor, isMyTurn, gameState?.turnOrderRolls, gameState?.diceValue]);




useEffect(() => {
  if (gameState?.turn && gamePhase === 'playing') {
    setShowTurnPopup(true);
    Animated.sequence([
      Animated.timing(popupAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(popupAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => setShowTurnPopup(false));
  }
}, [gameState?.turn, gamePhase]);

  // Chat mesajları için unread sayısını takip et
  useEffect(() => {
    if (!isChatVisible && chatMessages && chatMessages.length > 0) {
      // Chat kapalıyken yeni mesaj gelirse unread sayısını artır
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage && lastMessage.userId !== currentUser?.id) {
        setUnreadMessageCount(prev => prev + 1);
      }
    }
  }, [chatMessages, isChatVisible, currentUser]);

  // Chat açıldığında unread sayısını sıfırla
  useEffect(() => {
    if (isChatVisible) {
      setUnreadMessageCount(0);
    }
  }, [isChatVisible]);

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

  const renderTurnOrderRolls = () => (
    <View style={styles.turnOrderContainer}>
      <Text style={styles.turnOrderTitle}>Sıralama için zar atın!</Text>
      <View style={styles.turnOrderList}>
        {gameState?.turnOrderRolls?.map((roll, index) => (
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



  useEffect(() => {
    if (roomClosed.isClosed) {
      const timer = setTimeout(() => {
        alert(roomClosed.reason || 'Oda kapatıldı');
        router.replace('/(auth)/home');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [roomClosed, router]);

  useEffect(() => {
    let unsubscribe;
    const onBack = () => true; 

    if (gamePhase === 'waiting' || gamePhase === 'pre-game') {
      BackHandler.addEventListener('hardwareBackPress', onBack);
      unsubscribe = navigation.addListener('beforeRemove', e => e.preventDefault());
      navigation.setOptions?.({ gestureEnabled: false });
    } else {
      BackHandler.removeEventListener('hardwareBackPress', onBack);
      if (unsubscribe) unsubscribe();
      navigation.setOptions?.({ gestureEnabled: true });
    }

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBack);
      if (unsubscribe) unsubscribe();
    };
  }, [gamePhase, navigation]);

  if (roomClosed.isClosed) {
    return (
      <ImageBackground 
        source={require('../../assets/images/wood-background.png')} 
        style={[styles.background, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Oda kapatılıyor...</Text>
      </ImageBackground>
    );
  }

  const renderWaitingOverlay = () => {
  const maxPlayers = 4;
  const currentPlayers = players || [];
  const missingPlayers = maxPlayers - currentPlayers.length;
  return (
    <View style={styles.overlay}>
      <LottieView
        source={require('../../assets/animations/loading-online-players.json')}
        style={{ width: 200, height: 200, marginBottom: 10 }}
        autoPlay
        loop
      />
      <Text style={[styles.loadingText, {marginBottom: 10}]}>Bekleme Odası</Text>
      <View style={{width: '90%', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 12, marginBottom: 10}}>
        {currentPlayers.length === 0 ? (
          <Text style={{color: '#fff', fontSize: 16, textAlign: 'center'}}>Bağlantı kuruluyor, oyuncular yükleniyor...</Text>
        ) : (
          <>
            {currentPlayers.map((player, idx) => (
              <View key={player.id || player.color || idx} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
                <View style={{width: 18, height: 18, backgroundColor: COLORS[player.color], borderRadius: 4, marginRight: 8, borderWidth: 1, borderColor: '#fff'}} />
                <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>{player.nickname || 'Oyuncu'}</Text>
                
              </View>
            ))}
            <Text style={{color: '#ccc', fontSize: 15, marginTop: 4}}>
              {`${currentPlayers.length}/4 oyuncu, ${missingPlayers > 0 ? `${missingPlayers} oyuncu bekleniyor...` : 'Oyun başlamak üzere!'}`}
            </Text>
            {isCreator && missingPlayers > 0 && timeLeft > 0 && (
               <Text style={{color: '#FFD700', fontSize: 14, marginTop: 8, textAlign: 'center', fontWeight: 'bold'}}>
                 {`Oyun başlıyor: ${timeLeft} saniye`}
               </Text>
             )}
             {isCreator && timeLeft === 0 && missingPlayers > 0 && (
               <Text style={{color: '#FF6B6B', fontSize: 14, marginTop: 8, textAlign: 'center', fontWeight: 'bold'}}>
                 Oyun başlıyor...
               </Text>
             )}
          </>
        )}
      </View>
      <Text style={{color: '#fff', fontSize: 15, fontStyle: 'italic'}}>
         {isCreator && missingPlayers > 0 
           ? 'Oda kurucusu olarak 20 saniye sonra oyun başlayacak.' 
           : 'Oyun, tüm oyuncular katıldığında otomatik başlayacak.'}
       </Text>
    </View>
  );
};



  const renderPlayerInfo = () => {
    const getPlayerStatus = (playerColor) => {
      if (gamePhase === 'finished') return winner === playerColor ? 'Kazandı!' : 'Kaybetti';
      if (gameState?.currentPlayer === playerColor) return 'Sıra Sizde';
      return 'Sıra Rakipte';
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

  // --- AI MODUNDAKİYLE BİREBİR OYUN BİTİŞ MODALİ ---
  const renderWinnerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={gamePhase === 'finished' && !!winner}
      onRequestClose={() => {}}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.winnerText}>Kazanan</Text>
          <Text style={styles.winnerName}>{winner && playersInfo && playersInfo[winner] ? playersInfo[winner].nickname : ''}</Text>
          <Text style={styles.pointsWonText}>+10 Puan!</Text>
          <LottieView
            source={require("../../assets/animations/firstwinner.json")}
            style={styles.lottieWinner}
            autoPlay
            loop={false}
          />
          <View style={styles.modalFooterButtons}>
            <TouchableOpacity onPress={() => router.replace('/(auth)/home')} style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Ana Menü</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );



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
    if (socket && room?.id) {
      console.log(`[Game] Leaving room: ${room.id}`);
      socket.emit('leave_room', { roomId: room.id });
      router.replace('/(auth)/home');
    }
  };

  const rollDiceForTurnOrder = () => {
    console.log('[ACTION] rollDiceForTurnOrder fonksiyonu çağrıldı.');
    console.log('[ACTION] Socket bağlantısı var mı?:', !!socket);
    console.log('[ACTION] Oda ID:', room?.id);
    if (socket && room?.id) {
      console.log(`[ACTION] Sunucuya 'roll_dice_turn_order' gönderiliyor. Oda: ${room.id}`);
      socket.emit('roll_dice_turn_order', { roomId: room.id });
    } else {
      console.error('[HATA] Zar atılamadı. Socket veya Oda ID eksik.', {
        socketMevcut: !!socket,
        odaId: room?.id
      });
    }
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
        {showTurnPopup && (
          <Animated.View style={[styles.turnPopup, popupStyle]}>
            <Text style={styles.turnPopupText}>Sıra Sende!</Text>
          </Animated.View>
        )}

        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.turnText}>
              {gamePhase === 'pre-game'
                ? 'Sıra Belirleme Turu'
                : `Sıra: ${playersInfo && gameState?.currentPlayer && (playersInfo[gameState.currentPlayer]?.nickname || '...')}`}
            </Text>
            <View style={[styles.turnColorBox, { backgroundColor: COLORS[gameState?.currentPlayer] || '#888' }]} />
          </View>
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
        </View>

        {(gamePhase === 'waiting' || (gamePhase !== 'finished' && (!players || players.length < 4))) && renderWaitingOverlay()}

        {(gamePhase === 'pre-game' || gamePhase === 'playing' || gamePhase === 'finished') && (
          <>
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
                  (gamePhase === 'pre-game' && gameState?.turnOrderRolls && myColor && gameState.turnOrderRolls.find(roll => roll.color === myColor))) && 
                  <Dice number={
                    gamePhase === 'playing' 
                      ? gameState?.diceValue 
                      : gameState?.turnOrderRolls?.find(roll => roll.color === myColor)?.roll
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
            <ChatComponent
              isVisible={isChatVisible}
              onToggle={() => {
                console.log('Chat toggle pressed, current state:', isChatVisible);
                setIsChatVisible(!isChatVisible);
              }}
              messages={chatMessages || []}
              onSendMessage={sendMessage}
              currentUser={{ id: user?.id, nickname: user?.nickname }}
              warningMessage={chatWarning}
              isBlocked={chatBlocked}
              blockDuration={chatBlockDuration}
              onProfanityWarning={handleProfanityWarning}
              onMessageBlocked={handleMessageBlocked}
            />
            

          </>
        )}

        {renderWinnerModal()}
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
    justifyContent: 'space-around',
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
    maxWidth: 400,
    maxHeight: 400,
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    width: '90%',
    maxWidth: 400,
    margin: 20,
    backgroundColor: 'rgba(12, 26, 62, 0.95)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  winnerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#66ff66',
    marginBottom: 10,
    textAlign: 'center',
  },
  winnerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 5,
  },
  lottieWinner: {
    width: 200,
    height: 200,
    marginVertical: 10,
  },
  modalFooterButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
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
    marginBottom: 10,
  },
});

export default OnlineGameScreen;
