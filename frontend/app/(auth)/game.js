import React, { useState, useEffect } from 'react';
import { 
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
// import { Button } from '@rneui/themed'; // Replaced for debugging
import GameBoard from '../../components/modules/GameBoard';
import Dice from '../../components/shared/Dice';
import { useGameEngine } from '../../hooks/useGameEngine';
import { COLORS } from '../../constants/game';
import LottieView from 'lottie-react-native';


const GameScreen = ({ mode }) => {
  const router = useRouter();
  const { user } = useAuth();
  const username = user?.user_metadata?.username;
  const { state, dispatch } = useGameEngine(mode, username);
  const [showTurnPopup, setShowTurnPopup] = useState(false);
  const [popupAnim] = useState(new Animated.Value(0));


  useEffect(() => {
    if (state.currentPlayer && state.gamePhase === 'playing') {
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
  }, [state.currentPlayer, state.gamePhase]);

  const handleRollDice = () => {
    if (state.isRolling) return;

    if (state.gamePhase === 'pre-game') {
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

  // --- DEBUG LOG ---
  useEffect(() => {
    console.log(`[Game State] Current Player: ${state.currentPlayer}, Is AI?: ${state.aiPlayers.includes(state.currentPlayer)}, AI Players: ${JSON.stringify(state.aiPlayers)}, Phase: ${state.gamePhase}`);
  }, [state.currentPlayer, state.gamePhase]);

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

  const handleNewGame = () => {
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.turnText}>
          {state.gamePhase === 'pre-game'
            ? 'Sıra Belirleme Turu'
            : `Sıra: ${state.playersInfo && state.playersInfo[state.currentPlayer]?.nickname}`}
        </Text>
        <View style={[styles.turnColorBox, { backgroundColor: COLORS[state.currentPlayer] }]} />
      </View>

      <GameBoard
        style={styles.gameBoard} // Add a specific style for the board
        pawns={state.pawns}
        onPawnPress={handlePawnPress}
        currentPlayer={state.currentPlayer}
        diceValue={state.diceValue}
        playersInfo={state.playersInfo}
      />

      <View style={styles.controlsContainer}>
        <View style={styles.messageContainer}>
          <Text style={styles.gameMessage}>{state.gameMessage}</Text>
        </View>

        {state.gamePhase === 'pre-game' && (
          <View style={styles.turnOrderContainer}>
            {state.turnOrderRolls.map((roll, index) => (
              <Text key={index} style={styles.turnOrderText}>
                {state.playersInfo[roll.color].nickname}: {roll.roll}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.diceAndButtonContainer}>
          {state.diceValue && !state.winner && <Dice number={state.diceValue} />}
          
          <View style={styles.controls}>
            {state.aiPlayers.includes(state.currentPlayer) ? (
              <Text style={styles.aiThinkingText}>AI düşünüyor...</Text>
            ) : (
              // Only show the button if it's a human's turn and the game is not over
              !state.aiPlayers.includes(state.currentPlayer) && !state.winner && (
                <TouchableOpacity
                  onPress={handleRollDice}
                  disabled={
                    (state.gamePhase === 'playing' && state.diceValue !== null) ||
                    (state.gamePhase === 'pre-game' && state.turnOrderRolls.some(r => r.color === state.currentPlayer))
                  }
                  style={[
                    styles.actionButton,
                    ((state.gamePhase === 'playing' && state.diceValue !== null) ||
                    (state.gamePhase === 'pre-game' && state.turnOrderRolls.some(r => r.color === state.currentPlayer))) && styles.disabledButton
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={!!state.winner}
        onRequestClose={() => { /* Must select an option */ }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.winnerText}>Kazanan</Text>
            <Text style={styles.winnerName}>{state.winner ? state.playersInfo[state.winner]?.nickname : ''}</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1a3e',
    padding: 10,
    justifyContent: 'space-around', // Changed for better spacing
    alignItems: 'center', // Center items horizontally
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    width: '95%', // Use a percentage of the screen width
    aspectRatio: 1, // Keep it square
    maxWidth: 400, // Max width to avoid being too large on tablets
    maxHeight: 400, // Max height
  },
  controlsContainer: {
    width: '95%', // Make it almost full width
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    justifyContent: 'space-around', // Reverted to space-around for better centering
    alignItems: 'center',
    minHeight: 80,
  },
  controls: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  winnerContainer: {
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#66ff66',
    marginBottom: 20,
    textAlign: 'center',
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
  newGameButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
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
    bottom: '25%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
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
    marginTop: 22,
  },
  modalView: {
    width: '90%',
    maxWidth: 400,
    margin: 20,
    backgroundColor: 'rgba(12, 26, 62, 0.9)', // Dark blue, slightly transparent
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  lottieWinner: {
    width: 250,
    height: 250,
    marginTop: 10, // Add some space below the name
  },
  winnerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color
    marginBottom: 5,
  },
  winnerName: {
    fontSize: 22,
    color: 'white',
    marginBottom: 25,
  },
  modalFooterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});

const GameScreenWrapper = () => {
  const { mode } = useLocalSearchParams();
  return <GameScreen mode={mode} />;
};

export default GameScreenWrapper;
