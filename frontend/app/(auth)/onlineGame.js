import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Modal } from 'react-native';
import { useOnlineGameEngine } from '@/hooks/useOnlineGameEngine';
import { useSocket } from '@/store/SocketProvider';
import { useAuth } from '@/store/AuthProvider';
import GameBoard from '@/components/modules/GameBoard';
import Dice from '@/components/shared/Dice';

// PlayerInfo component defined locally to resolve module issue
const PlayerInfo = ({ players, currentPlayerId }) => (
  <View style={styles.playerInfoContainer}>
    {players.map(player => (
      <View key={player.id} style={[styles.playerInfo, currentPlayerId === player.id && styles.currentPlayerInfo]}>
        <View style={[styles.playerColor, { backgroundColor: player.color }]} />
        <Text style={styles.playerText}>{player.nickname}</Text>
      </View>
    ))}
  </View>
);

const OnlineGameScreen = () => {
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const timeoutRef = useRef(null);
  const { user } = useAuth();
  const { roomId } = useLocalSearchParams();
  const router = useRouter();
  const { socket } = useSocket();
  const { state, isHost, startGame, rollDice, movePawn } = useOnlineGameEngine(roomId);

  useEffect(() => {
    const isWaitingForPlayers = state.gamePhase === 'waiting';
    const isAlone = state.players.length === 1;

    // If we are waiting and alone, and no timer is running, start one.
    if (isWaitingForPlayers && isAlone && !timeoutRef.current) {
      console.log('[OnlineGame] Player is alone, starting 60s timeout.');
      timeoutRef.current = setTimeout(() => {
        console.log('[OnlineGame] Timeout reached. Notifying user to close room.');
        setShowTimeoutModal(true);
        socket.emit('leave_room', { roomId });
      }, 60000); // 60 seconds
    }

    // If we are no longer waiting alone (e.g., another player joined), clear the timer.
    if ((!isWaitingForPlayers || !isAlone) && timeoutRef.current) {
      console.log('[OnlineGame] Conditions changed (player joined or game started), clearing timeout.');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state.gamePhase, state.players.length, socket, roomId]);

  useEffect(() => {
    if (state.isRoomDeleted) {
      console.log('[UI] useEffect detected state.isRoomDeleted = true. Navigating...');
      Alert.alert('Oda Kapatıldı', 'Oda, 5 dakika boyunca aktif olmadığı için sunucu tarafından kapatıldı.', [
        { text: 'Tamam', onPress: () => router.replace('/(auth)/lobby') },
      ]);
    }
  }, [state.isRoomDeleted, router]);

  if (!state || state.gamePhase === 'connecting') {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007AFF"/>
        <Text style={styles.loadingText}>Connecting to room...</Text>
      </View>
    );
  }

  if (state.gamePhase === 'waiting') {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.waitingTitle}>Room: {roomId}</Text>
        <Text style={styles.playersTitle}>Players:</Text>
        {state.players.map(p => <Text key={p.id}>{p.nickname} ({p.color})</Text>)}
        {isHost ? (
          <Button title="Start Game" onPress={startGame} disabled={state.players.length < 2} />
        ) : (
          <Text style={styles.waitingText}>Waiting for the host to start the game...</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal
        transparent={true}
        visible={showTimeoutModal}
        animationType="fade"
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Oyun için yeterli sayıda katılımcı olmadığından oda silinmiştir.</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/(auth)/lobby')}
            >
              <Text style={styles.buttonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <PlayerInfo players={state.players} currentPlayerId={state.currentPlayer} />
      <Text style={styles.gameMessage}>{state.gameMessage || ' '}</Text>

      {state.winner ? (
        <View style={styles.winnerContainer}>
          <Text style={styles.winnerText}>{state.players.find(p => p.id === state.winner)?.nickname} Kazandı!</Text>
          <TouchableOpacity onPress={() => router.replace('/lobby')} style={styles.button}>
              <Text style={styles.buttonText}>Lobiye Dön</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <GameBoard pawns={state.pawns} onPawnPress={movePawn} />
          <View style={styles.diceContainer}>
            <TouchableOpacity onPress={rollDice} disabled={state.currentPlayer !== user?.id || state.diceValue !== null}>
                <Dice diceValue={state.diceValue} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F5FCFF',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  waitingText: {
    marginTop: 20,
    fontStyle: 'italic',
    color: '#666',
  },
  bottomContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameMessage: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  playerInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
  },
  playerInfo: {
    alignItems: 'center',
    padding: 5,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentPlayerInfo: {
    borderColor: '#FFD700', // Gold border for current player
    transform: [{ scale: 1.1 }],
  },
  playerColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 5,
  },
  playerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Modal styles from game.js for consistency
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 18,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default OnlineGameScreen;
