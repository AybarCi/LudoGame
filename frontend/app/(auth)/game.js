import React, { useState, useEffect } from 'react';
import {
  ImageBackground,
  SafeAreaView,
  Text,
  StyleSheet,
  Modal,
  Animated,
  View,
  TouchableOpacity
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../store/AuthProvider';
import { useSocket } from '../../store/SocketProvider';
import GameBoard from '../../components/modules/GameBoard';
import Dice from '../../components/shared/Dice';
import { useGameEngine } from '../../hooks/useGameEngine';
import { COLORS } from '../../constants/game';
import LottieView from 'lottie-react-native';

const GameScreen = () => {
  const { session, user, updateScore } = useAuth();
  const { gameId, mode, playersInfo: playersInfoString } = useLocalSearchParams();
  const { socket } = useSocket();
  const router = useRouter();

  // Decode playersInfo from the navigation parameters if it exists
  const playersInfoFromParams = playersInfoString ? JSON.parse(playersInfoString) : null;

  // The hook now handles both single-player and multi-player modes
  const { state, dispatch } = useGameEngine(
    socket,
    gameId,
    session?.user?.id,
    mode,
    playersInfoFromParams
  );
  const { gamePhase, winner, pawns, currentPlayer, diceValue, isRolling, gameMessage, turnOrderRolls, aiPlayers, playersInfo, isInitialized } = state;

  useEffect(() => {
    // Only initialize if we have the params and the game isn't already initialized.
    if (playersInfoFromParams && !isInitialized) {
      dispatch({
        type: 'INITIALIZE_GAME',
        payload: { mode, playersInfo: playersInfoFromParams },
      });
    }
    // Use the string version in the dependency array to prevent re-runs from new object creation.
  }, [playersInfoString, mode, isInitialized, dispatch]);

  const [showTurnPopup, setShowTurnPopup] = useState(false);
  const [popupAnim] = useState(new Animated.Value(0));
  // --- Award points to the winner ---
  useEffect(() => {
    if (gamePhase === 'game-over' && winner && playersInfo[winner]) {
      const winnerInfo = playersInfo[winner];
      // Ensure the winner is a real player with a user_id, not an AI
      if (winnerInfo.user_id && winnerInfo.user_id === user.id) {
        console.log(`Awarding 10 points to ${winnerInfo.nickname} (ID: ${winnerInfo.user_id})`);
        updateScore(10);
      }
    }
  }, [gamePhase, winner, playersInfo, user, updateScore]);

  // --- Turn change popup animation ---
  useEffect(() => {
    if (currentPlayer && gamePhase === 'playing') {
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
  }, [currentPlayer, gamePhase]);

  const handleRollDice = () => {
    if (isRolling) return;

    if (gamePhase === 'pre-game') {
      dispatch({ type: 'ROLL_DICE_FOR_TURN_ORDER' });
    } else {
      dispatch({ type: 'ROLL_DICE' });
    }
  };

  const handleResetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const handlePawnPress = (pawnId) => {
    dispatch({ type: 'MOVE_PAWN', payload: { pawnId } });
  };

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
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/wood-background.png')}
      style={{flex: 1}}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
      {showTurnPopup && (
        <Animated.View style={[styles.popupContainer, popupStyle]}>
          <Text style={styles.popupText}>{playersInfo && playersInfo[currentPlayer]?.nickname}'s Turn</Text>
        </Animated.View>
      )}

      <View style={styles.header}>
        <Text style={styles.turnText}>
          {gamePhase === 'pre-game'
            ? 'Sıra Belirleme Turu'
            : `Sıra: ${playersInfo && playersInfo[currentPlayer]?.nickname}`}
        </Text>
        <View style={[styles.turnColorBox, { backgroundColor: COLORS[currentPlayer] }]} />
      </View>

      <GameBoard
        style={styles.gameBoard}
        pawns={pawns}
        onPawnPress={handlePawnPress}
        currentPlayer={currentPlayer}
        diceValue={diceValue}
        playersInfo={playersInfo}
      />

      <View style={styles.controlsContainer}>
        <View style={styles.messageContainer}>
          <Text style={styles.gameMessage}>{gameMessage}</Text>
        </View>

        {gamePhase === 'pre-game' && (
          <View style={styles.turnOrderContainer}>
            {turnOrderRolls.map((roll, index) => (
              <Text key={index} style={styles.turnOrderText}>
                {playersInfo && playersInfo[roll.color]?.nickname}: {roll.roll}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.diceAndButtonContainer}>
          {diceValue && !winner && <Dice number={diceValue} />}
          
          <View style={styles.controls}>
            {aiPlayers.includes(currentPlayer) ? (
              <Text style={styles.aiThinkingText}>AI düşünüyor...</Text>
            ) : (
              !winner && (
                <TouchableOpacity
                  onPress={handleRollDice}
                  disabled={
                    (gamePhase === 'playing' && diceValue !== null) ||
                    (gamePhase === 'pre-game' && turnOrderRolls.some(r => r.color === currentPlayer))
                  }
                  style={[
                    styles.actionButton,
                    ((gamePhase === 'playing' && diceValue !== null) ||
                    (gamePhase === 'pre-game' && turnOrderRolls.some(r => r.color === currentPlayer))) && styles.disabledButton
                  ]}
                >
                  <Text style={styles.actionButtonText}>Zar At</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
        <View style={styles.footerButtonsContainer}>
          <TouchableOpacity onPress={handleResetGame} style={styles.footerButton}>
            <Text style={styles.footerButtonText}>Yeni Oyun</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.footerButton}>
            <Text style={styles.footerButtonText}>Ana Menü</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Real Winner Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!winner}
        onRequestClose={() => { /* Must select an option */ }}
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
              <TouchableOpacity onPress={handleResetGame} style={styles.footerButton}>
                <Text style={styles.footerButtonText}>Yeni Oyun</Text>
              </TouchableOpacity>
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
  turnOrderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 15,
  },
  turnOrderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
  popupContainer: {
    position: 'absolute',
    top: '15%', // Position it higher up
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10, // Ensure it's on top
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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
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
    textShadow: '-1px 1px 10px rgba(0, 0, 0, 0.75)',
    marginBottom: 5,
  },
  pointsWonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50', // Green color for points
    marginTop: 5,
    marginBottom: 10,
  },
  lottieWinner: {
    width: 250,
    height: 250,
  },
  modalFooterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    width: '100%',
  },
});

const GameScreenWrapper = () => {
  const { mode } = useLocalSearchParams();
  return <GameScreen mode={mode} />;
};

export default GameScreenWrapper;
