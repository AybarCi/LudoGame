import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSocket } from '@/store/SocketProvider';
import { useAuth } from '@/store/AuthProvider';
import { useRouter } from 'expo-router';

const Lobby = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const nickname = user?.user_metadata?.nickname || 'Guest';

  useEffect(() => {
    if (!socket) {
      console.log('[Lobby] Socket not available yet.');
      return;
    }

    const handleUpdateRooms = (updatedRooms) => {
      setRooms(updatedRooms);
      setIsLoading(false);
    };

    const handlePlayerJoined = (room) => {
        setRooms(prevRooms => ({...prevRooms, [room.id]: room}));
    };

    const handlePlayerLeft = (room) => {
        setRooms(prevRooms => ({...prevRooms, [room.id]: room}));
    };

    socket.on('update_rooms', handleUpdateRooms);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);

    console.log('[Lobby] Requesting initial room list...');
    socket.emit('get_rooms', (initialRooms) => {
      console.log('[Lobby] Received initial rooms:', initialRooms);
      handleUpdateRooms(initialRooms);
    });

    return () => {
      socket.off('update_rooms', handleUpdateRooms);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
    };
  }, [socket]);

  const handleCreateRoom = () => {
    if (!socket) return;
    setIsLoading(true);
    socket.emit('create_room', { nickname }, (response) => {
      setIsLoading(false);
      if (response.success) {
        router.push(`/game?roomId=${response.room.id}`);
      } else {
        alert(`Failed to create room: ${response.message}`);
      }
    });
  };

  const handleJoinRoom = (roomId) => {
    if (!socket) return;
    socket.emit('join_room', { roomId, nickname }, (response) => {
      if (response.success) {
        router.push(`/game?roomId=${roomId}`);
      } else {
        alert(`Could not join room: ${response.message}`);
      }
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Odalar Yükleniyor...</Text>
      </View>
    );
  }

  const roomList = Object.values(rooms);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateRoom}>
        <Text style={styles.createButtonText}>Oda Kur</Text>
      </TouchableOpacity>
      
      <FlatList
        data={roomList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.roomItem}>
            <View>
              <Text style={styles.roomName}>{`Oda #${item.id.slice(-5)}`}</Text>
              <Text style={styles.playerCount}>{`Oyuncular: ${item.playerCount} / 4`}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.joinButton, (item.playerCount >= 4 || item.isGameStarted) && styles.joinButtonDisabled]}
              onPress={() => handleJoinRoom(item.id)}
              disabled={item.playerCount >= 4 || item.isGameStarted}
            >
              <Text style={styles.joinButtonText}>{item.isGameStarted ? 'Oynanıyor' : 'Katıl'}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListHeaderComponent={<Text style={styles.title}>Aktif Odalar</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>Henüz kimse oda kurmamış. İlk odayı sen kur!</Text>}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#343A40',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    width: '100%',
  },
  roomItem: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
  },
  playerCount: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 5,
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6C757D',
  },
  joinButtonDisabled: {
    backgroundColor: '#A9A9A9', // Grey out when disabled
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  }
});

export default Lobby;
