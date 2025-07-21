import React, { useState, useEffect, useMemo } from 'react';
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
  const { roomId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { state, movePawn } = useOnlineGameEngine(roomId);
  const { gameState, players, gamePhase, winner, turnOrderRolls, message, isMyTurn } = state;
  const { socket, roomClosed } = useSocket(); // socket nesnesini al
  const [showTurnPopup, setShowTurnPopup] = useState(false);
  const [popupAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    console.log('--- DEBUG: Game State Update ---');
    console.log('Raw Players Array:', JSON.stringify(players, null, 2));
    console.log('Is My Turn:', isMyTurn);
    console.log('Game Phase:', gamePhase);
    console.log('Current Player Color from GameState:', gameState?.currentPlayer);
    console.log('My Socket ID:', socket?.id);
    console.log('---------------------------------');
  }, [players, isMyTurn, gamePhase, gameState?.currentPlayer, socket?.id]);

  const playersInfo = useMemo(() => {
    if (!players) return {};
    return players.reduce((acc, player) => {
      acc[player.color] = { nickname: player.nickname };
      return acc;
    }, {});
  }, [players]);

  // Mevcut oyuncunun rengini socket id'ye göre doğru bir şekilde bul
  const myColor = players.find(p => p.id === socket.id)?.color;

  const rollDiceForTurnOrder = () => {
    const playerHasRolled = gameState.turnOrderRolls.some(r => r.color === myColor);
    if (!playerHasRolled) {
      socket.emit('roll_dice_for_turn_order', { roomId });
    }
  };

  const rollDiceRegular = () => {
    if (isMyTurn) {
      socket.emit('roll_dice', { roomId });
    }
  };

  // --- Turn change popup animation ---
  useEffect(() => {
    if (gameState?.turn && gamePhase === 'playing') {
      setShowTurnPopup(true);
      Animated.sequence([
        Animated.timing(popupAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(popupAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => setShowTurnPopup(false));
    }
  }, [gameState?.turn, gamePhase]);

  const popupStyle = {
    opacity: popupAnim,
    transform: [
      {
        translateY: popupAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  };
  
  const isTurnOrderPhase = gamePhase === 'pre-game';

  const currentPlayerInfo = useMemo(() => {
    if (!gameState?.currentPlayer || !players?.length) {
      return null;
    }
    return players.find(p => p.color === gameState.currentPlayer);
  }, [gameState?.currentPlayer, players]);

  const diceToShow = useMemo(() => {
    if (isTurnOrderPhase) {
      return turnOrderRolls?.length > 0 ? turnOrderRolls[turnOrderRolls.length - 1].roll : null;
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

    function handleLeftRoom() {
      console.log('[Socket] Successfully left room, navigating to lobby.');
      router.replace('/lobby');
    }

    socket.on('left_room_success', handleLeftRoom);

    return () => {
      socket.off('left_room_success', handleLeftRoom);
    };
  }, [roomClosed, socket, router]);



  // Oda kapatıldıysa yükleme ekranı göster
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


const renderWaitingOverlay = () => (
  <View style={styles.overlay}>
    <LottieView
      source={require('../../assets/animations/loading-online-players.json')}
      style={{ width: 250, height: 250 }}
      autoPlay
      loop
    />
    <Text style={styles.loadingText}>Oyuncular bekleniyor...</Text>
  </View>
);

// Geri tuşunu ve swipe-back gesture'ı devre dışı bırak (bekleme ekranında)
useEffect(() => {
  let unsubscribe;
  const onBack = () => true;

  if (gamePhase === 'waiting') {
    BackHandler.addEventListener('hardwareBackPress', onBack);
    unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (gamePhase === 'waiting') e.preventDefault();
    });
    // Expo Router/React Navigation swipe-back gesture'ı kapat
    navigation.setOptions?.({ gestureEnabled: false });
  } else {
    // Diğer fazlarda swipe-back tekrar açılsın
    navigation.setOptions?.({ gestureEnabled: true });
  }

  return () => {
    BackHandler.removeEventListener('hardwareBackPress', onBack);
    if (unsubscribe) unsubscribe();
  };
}, [gamePhase, navigation]);

  return (
    <ImageBackground 
      source={require('../../assets/images/wood-background.png')}
      style={{flex: 1}}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
      {showTurnPopup && (
        <Animated.View style={[styles.popupContainer, popupStyle]}>
          <Text style={styles.popupText}>{playersInfo && playersInfo[gameState?.turn]?.nickname} Sırası</Text>
        </Animated.View>
      )}


      {/* Koşullu Render: Bekleme ekranı VEYA Oyun Alanı */}
      {gamePhase === 'waiting' ? (
        renderWaitingOverlay()
      ) : (
        /* Oyun Alanı (Tahta, Kontroller vb.) */
        <>
          <View style={styles.header}>
            <Text style={styles.turnText}>
              {(() => {
                if (gamePhase === 'pre-game') {
                  return 'Sıra Belirleme Turu';
                }
                if (gamePhase === 'playing') {
                  if (isMyTurn) return 'Sıra Sende!';
                  if (currentPlayerInfo) return `Sıra: ${currentPlayerInfo.nickname}`;
                  return 'Sıra bekleniyor...';
                }
                if (gamePhase === 'finished') {
                  return 'Oyun Bitti!';
                }
                return message;
              })()}
            </Text>
            {gamePhase === 'playing' && currentPlayerInfo && (
              <View style={[styles.turnColorBox, { backgroundColor: COLORS[currentPlayerInfo.color] }]} />
            )}
          </View>



          {(gamePhase === 'playing' || gamePhase === 'pre-game') && (
            <View style={styles.gameContainer}>
              {gameState?.pawns && (
                <GameBoard
                  style={styles.gameBoard}
                  pawns={gameState.pawns}
                  onPawnPress={movePawn}
                  diceValue={gameState.diceValue}
                  playersInfo={playersInfo}
                  isMyTurn={isMyTurn}
                  myColor={myColor}
                  gamePhase={gamePhase}
                />
              )}
            </View>
          )}

          <View style={styles.controlsContainer}>
            {isTurnOrderPhase && (
              <View style={styles.turnOrderContainer}>
                <Text style={styles.gameMessage}>Başlamak için en yüksek zarı at!</Text>
                {turnOrderRolls.length > 0 && (
                  <View style={styles.rollsContainer}>
                    {turnOrderRolls.map((roll, index) => (
                      <Text key={index} style={styles.rollInfoText}>
                        {`${roll.nickname}: ${roll.roll}`}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.diceAndButtonContainer}>
              {diceToShow !== null && diceToShow !== undefined && !winner && <Dice number={diceToShow} />}

              <View style={styles.controls}>
                {(() => {
                  if (winner) return null;

                  if (isTurnOrderPhase) {
                    const playerHasRolled = turnOrderRolls.some(r => r.color === myColor);
                    if (playerHasRolled) {
                      return <Text style={styles.aiThinkingText}>Diğer oyuncuların zar atması bekleniyor...</Text>;
                    }
                    return (
                      <TouchableOpacity onPress={rollDiceForTurnOrder} style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Sıra İçin Zar At</Text>
                      </TouchableOpacity>
                    );
                  }

                  if (gamePhase === 'playing') {
                    if (!isMyTurn) {
                      return <Text style={styles.aiThinkingText}>{`Sıra: ${currentPlayerInfo?.nickname}`}</Text>;
                    }
                    return (
                      <TouchableOpacity
                        onPress={rollDiceRegular}
                        disabled={gameState?.diceValue !== null}
                        style={[styles.actionButton, gameState?.diceValue !== null && styles.disabledButton]}
                      >
                        <Text style={styles.actionButtonText}>Zar At</Text>
                      </TouchableOpacity>
                    );
                  }
                  return null;
                })()}
              </View>
            </View>
            <View style={styles.footerButtonsContainer}>
              <TouchableOpacity onPress={() => socket.emit('leave_room')} style={styles.footerButton}>
                <Text style={styles.footerButtonText}>Oyundan Çık</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Kazanan Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={gamePhase === 'finished'}
        onRequestClose={() => router.back()}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.winnerText}>Kazanan</Text>
            <Text style={styles.winnerName}>{winner && players.find(p => p.color === winner)?.nickname}</Text>
            <LottieView
              source={require('../../assets/animations/firstwinner.json')}
              style={styles.lottieWinner}
              autoPlay
              loop={false}
            />
            <View style={styles.modalFooterButtons}>
              <TouchableOpacity onPress={() => router.back()} style={styles.footerButton}>
                <Text style={styles.footerButtonText}>Ana Menü</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99,
  },
  exitButton: {
    marginTop: 32,
    backgroundColor: '#D32F2F',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 22,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  exitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'center',
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
    justifyContent: 'center',
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
    color: 'white',
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
