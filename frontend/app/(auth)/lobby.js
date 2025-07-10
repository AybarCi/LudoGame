import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useSocket } from '@/store/SocketProvider';
import { useAuth } from '@/store/AuthProvider';
import { useRouter } from 'expo-router';

const LobbyScreen = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const [roomId, setRoomId] = useState('');
  const [roomState, setRoomState] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdate = (data) => {
      console.log('Room updated:', data);
      setRoomState(data);
    };

    const handleGameStarted = (gameState) => {
      console.log('Game is starting!', gameState);
      // We will navigate to a NEW online game screen, not the existing one.
      // For now, let's just log it.
      router.push({ pathname: '/(auth)/onlineGame', params: { roomId: roomState.id } });
    };

    const handleErrorMessage = (message) => {
      Alert.alert('Error', message);
    };

    socket.on('room_update', handleRoomUpdate);
    socket.on('game_started', handleGameStarted);
    socket.on('error_message', handleErrorMessage);

    return () => {
      socket.off('room_update', handleRoomUpdate);
      socket.off('game_started', handleGameStarted);
      socket.off('error_message', handleErrorMessage);
    };
  }, [socket, router]);

  const handleCreateRoom = () => {
    if (socket && user) {
      const player = { id: user.id, username: user.user_metadata.username };
      socket.emit('create_room', { player });
    }
  };

  const handleJoinRoom = () => {
    if (socket && user && roomId) {
      const player = { id: user.id, username: user.user_metadata.username };
      socket.emit('join_room', { roomId: roomId.toUpperCase(), player });
    }
  };

  const handleStartGame = () => {
    if (socket && roomState?.id) {
      socket.emit('start_game', { roomId: roomState.id });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Online Lobi</Text>

      {!roomState ? (
        <View>
          <Button title="Yeni Oda Kur" onPress={handleCreateRoom} />
          <View style={styles.joinContainer}>
            <TextInput
              style={styles.input}
              placeholder="Oda ID'si"
              value={roomId}
              onChangeText={setRoomId}
              autoCapitalize="characters"
            />
            <Button title="Odaya Katıl" onPress={handleJoinRoom} />
          </View>
        </View>
      ) : (
        <View style={styles.roomContainer}>
          <Text style={styles.roomTitle}>Oda: {roomState.id}</Text>
          <Text style={styles.playersTitle}>Oyuncular:</Text>
          {Object.values(roomState.players).map((player) => (
            <Text key={player.id} style={styles.playerName}>{player.username}</Text>
          ))}
          {roomState.hostId === user.id && (
             <Button title="Oyunu Başlat" onPress={handleStartGame} disabled={Object.keys(roomState.players).length < 2} />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  joinContainer: {
    marginTop: 20,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    textAlign: 'center',
  },
  roomContainer: {
    alignItems: 'center',
  },
  roomTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  playersTitle: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
  },
  playerName: {
    fontSize: 16,
  },
});

export default LobbyScreen;
