import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../store/AuthProvider';
import { BackHandler } from 'react-native';
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
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import GameBoard from '../../components/modules/GameBoard';
import Dice from '../../components/shared/Dice';
import { useOnlineGameEngine } from '../../hooks/useOnlineGameEngine';
import { useSocket } from '../../store/SocketProvider';
import { COLORS } from '../../constants/game';
import LottieView from 'lottie-react-native';

const OnlineGameScreen = () => {
  const { user } = useAuth();
  const { roomId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { 
    socket, 
    room, 
    roomClosed, 
    gameState, 
    players, 
    currentTurn, 
    winner, 
    dice, 
    validMoves, 
    turnOrder, 
    preGameRolls, 
    socketId 
  } = useSocket(); 

  const { 
    createRoom, 
    joinRoom, 
    leaveRoom, 
    rollDice, 
    movePawn, 
    boardState 
  } = useOnlineGameEngine();


  // Multiplayer board burada açıldığı için navigation yapılmıyor.
  useEffect(() => {
    // Oyun 'pre-game' veya 'playing' fazına geçtiğinde gameboard'a yönlendir
    const currentPhase = room?.phase || room?.gameState?.phase || gameState?.phase;
    if (room && room.id && (currentPhase === 'pre-game' || currentPhase === 'playing')) {
      // router.replace(`/game/${room.id}`);
    }
  }, [room, router, gameState?.phase]);

  const gamePhase = room?.phase || room?.gameState?.phase || gameState?.phase || 'loading';
  const turnOrderRolls = gameState?.turnOrderRolls || [];
  const message = gameState?.message || '';

  const myColor = useMemo(() => {
  if (!players || !players.length) return null;
  let myPlayer = null;
  if (gamePhase === 'pre-game') {
    // Sıralama turunda sadece socketId ile eşleşme yap
    if (socketId) {
      myPlayer = players.find(p => p.id === socketId);
    }
  } else {
    // Oyun fazında önce user.id, yoksa socketId ile eşleşme yap
    if (user?.id) {
      myPlayer = players.find(p => p.id === user.id);
    }
    if (!myPlayer && socketId) {
      myPlayer = players.find(p => p.id === socketId);
    }
  }
  console.log('[DEBUG][MYCOLOR]', {
    userId: user?.id,
    socketId,
    players: players.map(p => ({id: p.id, color: p.color, nickname: p.nickname})),
    myColor: myPlayer?.color,
    gamePhase
  });
  return myPlayer?.color;
}, [players, user?.id, socketId, gamePhase]);

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
  // Sıralama turunda (pre-game) zar atma HERKESE açık olacak şekilde true dön
  if (gamePhase === 'pre-game') {
    return true;
  }
  // Oyun fazında: sadece sıra kimdeyse ve zar gösterilmiyorsa aktif
  let isCurrentPlayer = false;
  if (gamePhase === 'playing' && players && players.length > 0 && gameState?.currentPlayer) {
    // Öncelik: myColor eşleşirse
    if (myColor && gameState.currentPlayer === myColor) {
      isCurrentPlayer = true;
    } else {
      // Fallback: currentPlayer'a denk gelen oyuncunun kimliği socketId veya user.id ile eşleşiyor mu?
      const currentPlayerObj = players.find(p => p.color === gameState.currentPlayer);
      if (currentPlayerObj) {
        if ((socketId && currentPlayerObj.id === socketId) || (user?.id && currentPlayerObj.id === user.id)) {
          isCurrentPlayer = true;
        }
      }
    }
  }
  const value = isCurrentPlayer && (diceToShow == null);
  console.log('[DEBUG][CAN_ROLL_DICE]', {
    userId: user?.id,
    socketId,
    myColor,
    isCurrentPlayer,
    diceToShow: typeof diceToShow === 'undefined' ? 'undefined' : diceToShow,
    turnOrderRolls,
    gamePhase,
    players: players?.map(p => ({id: p.id, color: p.color, nickname: p.nickname})),
    value
  });
  return value;
}, [gamePhase, myColor, diceToShow, turnOrderRolls, user?.id, socketId, players, gameState?.currentPlayer]);


useEffect(() => {
  console.log('[DEBUG][ZAR AT] canRollDice:', canRollDice, 'isTurnOrderPhase:', isTurnOrderPhase, 'myColor:', myColor, 'turnOrderRolls:', turnOrderRolls, 'isMyTurn:', isMyTurn, 'diceToShow:', diceToShow);
}, [canRollDice, isTurnOrderPhase, myColor, turnOrderRolls, isMyTurn, diceToShow]);

useEffect(() => {
  if (gamePhase === 'playing') {
    console.log('[DEBUG][PLAYING]', {
      userId: user?.id,
      socketId: socket?.id,
      isMyTurn,
      diceToShow,
      currentPlayer: gameState?.currentPlayer,
      myColor,
      players: players?.map(p => ({id: p.id, color: p.color, nickname: p.nickname}))
    });
  }
}, [gamePhase, isMyTurn, diceToShow, gameState?.currentPlayer, myColor, user?.id, socket?.id, players]);

// AI modundaki gibi tam mapping (nickname, user_id, isBot)
// AI modundaki formatla birebir aynı playersInfo mapping'i
const playersInfo = useMemo(() => {
  if (!players || !players.length) return {};
  return players.reduce((acc, player) => {
    acc[player.color] = {
      nickname: player.nickname,
      user_id: player.user_id,
      isBot: player.isBot,
      color: player.color,
    };
    return acc;
  }, {});
}, [players]);

  const rollDiceForTurnOrder = () => {
    if (!socket || !players || !players.length || gamePhase !== 'pre-game') return;
    // 1. Öncelik: socketId ile bul
    let me = socketId && players.find(p => p.id === socketId);
    // 2. Öncelik: user.id ile bul (bazı edge-case'ler için)
    if (!me && user?.id) me = players.find(p => p.id === user.id);
    // 3. Öncelik: ilk bot olmayan player (en azından biri zar atabilsin)
    if (!me) me = players.find(p => !p.isBot);
    // 4. Hala yoksa: fallback ilk player
    if (!me) me = players[0];
    if (!me) {
      console.error('[ZAR AT][CRITICAL] Sıralama turunda oyuncu bulunamadı! players:', players, 'socketId:', socketId, 'userId:', user?.id);
      return;
    }
    const playerHasRolled = turnOrderRolls.some(r => r.color === me.color);
    if (!playerHasRolled) {
      socket.emit('roll_dice_for_turn_order', { roomId });
    } else {
      // Kullanıcıya görsel uyarı ver
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Bu turda zaten zar attınız!');
      } else if (typeof global !== 'undefined' && global?.Expo) {
        // Expo/React Native ortamı için basit bir Alert
        try {
          const { Alert } = require('react-native');
          Alert.alert('Bilgi', 'Bu turda zaten zar attınız!');
        } catch(e) {}
      }
      console.warn('[ZAR AT] Bu oyuncu zaten zar attı:', me);
    }
  };



  const rollDiceRegular = () => {
    if (socket && isMyTurn) {
      socket.emit('roll_dice', { roomId });
    }
  };

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

  const popupStyle = {
    opacity: popupAnim,
    transform: [{ translateY: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  };
  
  const isTurnOrderPhase = gamePhase === 'pre-game';

  const currentPlayerInfo = useMemo(() => {
    if (!gameState?.currentPlayer || !players.length) return null;
    return players.find(p => p.color === gameState.currentPlayer);
  }, [gameState?.currentPlayer, players]);

  const diceToShow = useMemo(() => {
    if (isTurnOrderPhase) {
      return turnOrderRolls.length > 0 ? turnOrderRolls[turnOrderRolls.length - 1].roll : null;
    }
    return gameState?.diceValue;
  }, [isTurnOrderPhase, turnOrderRolls, gameState?.diceValue]);

  useEffect(() => {
    if (roomClosed.isClosed) {
      const timer = setTimeout(() => {
        alert(roomClosed.reason || 'Oda kapatıldı');
        router.replace('/(tabs)');
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
          </>
        )}
      </View>
      <Text style={{color: '#fff', fontSize: 15, fontStyle: 'italic'}}>Oyun, tüm oyuncular katıldığında otomatik başlayacak.</Text>
    </View>
  );
};

  const renderTurnOrderRolls = () => (
    <View style={styles.turnOrderContainer}>
      <Text style={styles.turnOrderTitle}>Başlamak için en yüksek zarı at!</Text>
      <View style={styles.rollsContainer}>
        {turnOrderRolls.map((roll, index) => (
          <Text key={index} style={[styles.rollText, { color: COLORS[roll.color] || '#FFF' }]}>
            {playersInfo[roll.color]?.nickname}: {roll.roll}
          </Text>
        ))}
      </View>
    </View>
  );

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
          <Text style={styles.winnerName}>{winner && playersInfo ? playersInfo[winner]?.nickname : ''}</Text>
          <Text style={styles.pointsWonText}>+10 Puan!</Text>
          <LottieView
            source={require("../../assets/animations/firstwinner.json")}
            style={styles.lottieWinner}
            autoPlay
            loop={false}
          />
          <View style={styles.modalFooterButtons}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.footerButton}>
              <Text style={styles.footerButtonText}>Ana Menü</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Memoize boardState to prevent unnecessary re-renders and remounts
  const stableBoardState = useMemo(() => {
    // Only update if boardState reference changes
    return boardState;
  }, [boardState]);

  // --- Pawn selection logic for multiplayer, mirrors AI mode ---
  const handlePawnPress = (pawnId) => {
    // Only allow move if it's my turn and there is a valid move for this pawn
    if (!isMyTurn) return;
    if (!Array.isArray(gameState?.validMoves) || !gameState.validMoves.includes(pawnId)) return;
    if (typeof movePawn === 'function') {
      movePawn(pawnId);
    }
  };

  const renderHeader = () => {
    let title = 'Ludo Online';
    if (gamePhase === 'pre-game') title = 'Sıra Belirleniyor...';
    else if (gamePhase === 'playing' && currentPlayerInfo) title = `Sıra: ${currentPlayerInfo.nickname}`;
    else if (gamePhase === 'finished' && winner) title = `Kazanan: ${playersInfo[winner]?.nickname}`;
    else if (gamePhase === 'waiting') title = 'Oyuncular Bekleniyor...';

    return <Text style={styles.headerTitle}>{title}</Text>;
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

        {/* --- AI MODUNDAKİYLE BİREBİR HEADER --- */}
        <View style={styles.header}>
          <Text style={styles.turnText}>
            {gamePhase === 'pre-game'
              ? 'Sıra Belirleme Turu'
              : `Sıra: ${playersInfo && (playersInfo[boardState?.currentPlayer]?.nickname || '')}`}
          </Text>
          <View style={[styles.turnColorBox, { backgroundColor: COLORS[boardState?.currentPlayer || ''] || '#888' }]} />
        </View>

        {(gamePhase === 'waiting' || (players && players.length < 4)) && renderWaitingOverlay()}

        {(gamePhase === 'pre-game' || gamePhase === 'playing' || gamePhase === 'finished') && (
          <>
            <GameBoard
              key={room?.id || 'main-board'}
              {...stableBoardState}
              style={styles.gameBoard}
              onPawnPress={handlePawnPress}
            />
            <View style={styles.bottomContainer}>

              <View style={styles.controlsContainer}>
                <View style={styles.messageContainer}>
                  <Text style={styles.gameMessage}>{message}</Text>
                </View>
                {gamePhase === 'pre-game' && (
                  <View style={styles.turnOrderContainer}>
                    {turnOrderRolls.map((roll, idx) => (
                      <Text key={idx} style={styles.turnOrderText}>
                        {playersInfo && playersInfo[roll.color]?.nickname}: {roll.roll}
                      </Text>
                    ))}
                  </View>
                )}
                {Array.isArray(boardState?.moveHistory) && boardState.moveHistory.length > 0 && (
                  <View style={styles.moveHistoryContainer}>
                    {boardState.moveHistory.slice(-5).map((move, idx) => (
                      <Text key={idx} style={styles.moveHistoryText}>
                        {move}
                    </Text>
                  ))}
                </View>
              )}
              <View style={styles.diceAndButtonContainer}>
                {!winner && (
                  <Dice number={diceToShow || 1} style={{ marginRight: 14 }} />
                )}
                {players && boardState?.currentPlayer && players.find(p => p.color === boardState.currentPlayer)?.isBot ? (
                  <Text style={styles.aiThinkingText}>
                    {(players.find(p => p.color === boardState.currentPlayer)?.nickname || 'Rakip') + ' düşünüyor...'}
                  </Text>
                ) : !winner ? (
                  <TouchableOpacity
                    onPress={isTurnOrderPhase ? rollDiceForTurnOrder : rollDiceRegular}
                    disabled={!canRollDice}
                    style={[
                      styles.actionButton,
                      !canRollDice && styles.disabledButton
                    ]}
                  >
                    <Text style={styles.actionButtonText}>Zar At</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        </>
      )}

      {renderWinnerModal()}
    </SafeAreaView>
  </ImageBackground>
)};

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
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
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
    width: '100%',
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // Sıra belirleme turunda siyah bar yok, sadece yazılar var
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 7,
    marginTop: 7,
    minHeight: 32,
  },
  turnOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 7,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    // Her zaman beyaz ve yatayda, vertical stacking yok
  },
  // Loader stilleri
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
});

export default OnlineGameScreen;
