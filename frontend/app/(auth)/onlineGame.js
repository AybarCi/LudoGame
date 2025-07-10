import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocket } from '@/store/SocketProvider';
import useOnlineGameEngine from '@/hooks/useOnlineGameEngine';
import GameBoard from '@/components/modules/GameBoard';
import Dice from '@/components/shared/Dice';
import { Button } from '@rneui/themed';

const OnlineGameScreen = () => {
  const router = useRouter();
  const { roomId } = useLocalSearchParams();
  const { socket } = useSocket();
  const [initialState, setInitialState] = useState(null);

  // Listen for the initial game state from the server
  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = (gameState) => {
      console.log('Game starting with initial state:', gameState);
      setInitialState({ ...gameState, roomId });
    };

    socket.on('game_started', handleGameStarted);

    // Request initial state if we join late (or on refresh)
    // Note: A robust implementation would require a dedicated 'get_game_state' event.
    // For now, we rely on being present for 'game_started'.

    return () => {
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, roomId]);

  const { state, handleRollDice, handlePawnPress } = useOnlineGameEngine(initialState);

  if (!state.isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Oyun verisi bekleniyor...</Text>
      </View>
    );
  }

  const handleGoToMenu = () => {
    // Here we would emit a 'leave_room' event
    router.replace('/(auth)/home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.gameIdText}>Oda ID: {roomId}</Text>
      <Text style={styles.gameMessage}>{state.gameMessage}</Text>

      <GameBoard pawns={Object.values(state.pawns)} onPawnPress={handlePawnPress} />

      <Dice diceValue={state.diceValue} onRoll={handleRollDice} isRolling={state.isRolling} />

      <Button title="Menüye Dön" onPress={handleGoToMenu} containerStyle={styles.buttonContainer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  gameIdText: {
    color: '#fff',
    position: 'absolute',
    top: 40,
    left: 20,
    fontSize: 16,
  },
  gameMessage: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 30,
  },
});

export default OnlineGameScreen;
