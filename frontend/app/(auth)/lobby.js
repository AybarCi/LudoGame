import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ImageBackground, Modal } from 'react-native';
import { useSocket } from '@/store/SocketProvider';
import { useAuth } from '@/store/AuthProvider';
import { useRouter } from 'expo-router';

const Lobby = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showSelfJoinModal, setShowSelfJoinModal] = useState(false);

  useEffect(() => {
    if (!socket) {
      console.log('[Lobby] Socket not available yet.');
      return;
    }

    const handleUpdateRooms = (roomsArray) => {
      console.log('⬅️ [EVENT] Received update_rooms:', roomsArray);
      const roomsObject = roomsArray.reduce((acc, room) => {
        acc[room.id] = room;
        return acc;
      }, {});
      setRooms(roomsObject);
      setIsLoading(false);
    };

    const handlePlayerJoined = (room) => {
      console.log('⬅️ [EVENT] Received player_joined:', room);
      setRooms(prevRooms => ({ ...prevRooms, [room.id]: room }));
    };

    const handlePlayerLeft = (room) => {
      console.log('⬅️ [EVENT] Received player_left:', room);
      setRooms(prevRooms => ({ ...prevRooms, [room.id]: room }));
    };

    const handleGameStarted = (room) => {
      console.log(`[Lobby] Received game_started event for room: ${room.id}`);
      // Use the room object directly from the event to avoid race conditions with state updates.
      if (room && room.players && room.players.some(p => p.id === socket.id)) {
        console.log(`Navigating to game room ${room.id}`);
        router.push({
          pathname: '/onlineGame',
          params: { roomId: room.id },
        });
      }
    };

    // Set up listeners
    socket.on('update_rooms', handleUpdateRooms);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('game_started', handleGameStarted);

    // Initial fetch
    console.log('➡️ [REQUEST] Emitting get_rooms to server to fetch initial room list...');
    socket.emit('get_rooms', (roomsArray) => {
      console.log('⬅️ [RESPONSE] Received room list from server:', roomsArray);
      const roomsObject = roomsArray.reduce((acc, room) => {
        acc[room.id] = room;
        return acc;
      }, {});
      setRooms(roomsObject);
      setIsLoading(false);
    });

    // Cleanup listeners on unmount
    return () => {
      console.log('[Lobby] Cleaning up socket listeners.');
      socket.off('update_rooms', handleUpdateRooms);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('game_started', handleGameStarted);
    };
  }, [socket, router]);

  const handleCreateRoom = async () => {
    if (!socket) return;
    setIsLoading(true);
    try {
      const nickname = await AsyncStorage.getItem('user_nickname') || 'Guest';
      console.log(`[Lobby] Creating room with nickname: ${nickname}`);
      socket.emit('create_room', { nickname }, (response) => {
      console.log('✅ [RESPONSE] Received response for create_room:', JSON.stringify(response, null, 2));
      setIsLoading(false);
      if (response.success) {
        router.push(`/onlineGame?roomId=${response.room.id}`);
      } else {
        alert(`Failed to create room: ${response.message}`);
      }
    });
    } catch (e) {
      console.error('[Storage] Failed to read nickname for create_room.', e);
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    if (!socket) return;
    try {
      const nickname = await AsyncStorage.getItem('user_nickname') || 'Guest';
      socket.emit('join_room', { roomId, nickname }, (response) => {
      if (response.success) {
        router.push(`/onlineGame?roomId=${roomId}`);
      } else {
        // Check for the specific error message from the server
        if (response.message === 'You are already in this room.') {
          setShowSelfJoinModal(true);
        } else {
          alert(`Odaya katılamadınız: ${response.message}`);
        }
      }
    });
    } catch (e) {
      console.error('[Storage] Failed to read nickname for join_room.', e);
    }
  };

  // Render loading state (Temporarily disabled for UI review)
  /*
  if (isLoading) {
    return (
      <ImageBackground 
        source={require('../../assets/images/wood-background.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <View style={{flex: 1}}>    <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Odalar Yükleniyor...</Text>
        </View>
      </ImageBackground>
    );
  }
  */

  const roomList = Object.values(rooms);

  return (
    <ImageBackground 
      source={require('../../assets/images/wood-background.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      {/* Main content area */}
      <View style={styles.mainContent}>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateRoom}>
          <Text style={styles.createButtonText}>Oda Kur</Text>
        </TouchableOpacity>
        
        <View style={styles.listContainer}>
          <FlatList
            data={roomList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.roomItem}>
                <View>
                  <Text style={styles.roomName}>{`Oda #${item.id.slice(-5)}`}</Text>
                  <Text style={styles.playerCount}>{`Oyuncular: ${typeof item.playerCount === 'number' ? item.playerCount : 0} / 4`}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.joinButton, ((item.playerCount || 0) >= 4 || item.isGameStarted) && styles.joinButtonDisabled]}
                  onPress={() => handleJoinRoom(item.id)}
                  disabled={(item.playerCount || 0) >= 4 || item.isGameStarted}
                >
                  <Text style={styles.joinButtonText}>{item.isGameStarted ? 'Oynanıyor' : 'Katıl'}</Text>
                </TouchableOpacity>
              </View>
            )}
            ListHeaderComponent={<Text style={styles.title}>Aktif Odalar</Text>}
            ListEmptyComponent={<Text style={styles.emptyText}>Henüz kimse oda kurmamış. İlk odayı sen kur!</Text>}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>

      {/* Bottom button area */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(auth)/home')}>
          <Text style={styles.backButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={showSelfJoinModal}
        animationType="fade"
        onRequestClose={() => setShowSelfJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Uyarı</Text>
            <Text style={styles.modalText}>Kendi kurduğunuz bir odaya dışarıdan katılamazsınız.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowSelfJoinModal(false)}>
              <Text style={styles.modalButtonText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingTop: 60, // Adjust for status bar
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  createButton: {
    backgroundColor: '#e53935', 
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center', 
    marginHorizontal: 20, 
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    paddingVertical: 20, // Vertical padding remains
    paddingHorizontal: 10, // Horizontal padding is reduced
    marginHorizontal: 20,
    marginBottom: 20, // Added space between list and back button
  },
  listContent: {
    // Horizontal padding removed to allow items to fill the container
    paddingBottom: 20,
  },
  footer: {
    paddingBottom: 50, 
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 28, // Final increase to vertical padding
    paddingHorizontal: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    marginBottom: 12,
  },
  roomName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  playerCount: {
    fontSize: 14,
    color: '#ffffff',
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
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    paddingHorizontal: 20,
  },
  joinButtonDisabled: {
    backgroundColor: '#A9A9A9', 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#F3E9DD',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#C1A27B',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#5D4037',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#6D4C41',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#e53935',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    elevation: 3,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default Lobby;
