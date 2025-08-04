import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ImageBackground, Modal, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '@/store/SocketProvider';
import { useAuth } from '@/store/AuthProvider';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const Lobby = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showSelfJoinModal, setShowSelfJoinModal] = useState(false);
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.9);
  const [buttonAnims] = useState(() => 
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger button animations
    const buttonAnimations = buttonAnims.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, buttonAnimations).start();
  }, []);

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
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Header */}
          <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
            <View style={styles.titleContainer}>
              <Ionicons name="home" size={32} color="#fff" style={styles.titleIcon} />
              <Text style={styles.mainTitle}>Oyun Lobisi</Text>
            </View>
            <Text style={styles.subtitle}>Arkadaşlarınla oyna veya yeni oda kur</Text>
          </Animated.View>

          {/* Create Room Button */}
          <Animated.View 
            style={[
              styles.createButtonContainer,
              {
                opacity: buttonAnims[0],
                transform: [{ scale: buttonAnims[0] }]
              }
            ]}
          >
            <TouchableOpacity style={styles.createButton} onPress={handleCreateRoom}>
              <LinearGradient
                colors={['#ff6b6b', '#ee5a24']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.createButtonText}>Yeni Oda Kur</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        
          {/* Rooms List */}
          <Animated.View 
            style={[
              styles.listContainer,
              {
                opacity: buttonAnims[1],
                transform: [{ translateY: buttonAnims[1].interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })}]
              }
            ]}
          >
            <FlatList
              data={roomList}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <Animated.View
                  style={[
                    styles.roomItem,
                    {
                      opacity: buttonAnims[Math.min(index + 2, buttonAnims.length - 1)],
                      transform: [{ scale: buttonAnims[Math.min(index + 2, buttonAnims.length - 1)] }]
                    }
                  ]}
                >
                  <View style={styles.roomInfo}>
                    <View style={styles.roomHeader}>
                      <Ionicons name="people" size={20} color="#fff" />
                      <Text style={styles.roomName}>{`Oda #${item.id.slice(-5)}`}</Text>
                    </View>
                    <Text style={styles.playerCount}>
                      <Ionicons name="person" size={14} color="#bbb" />
                      {` ${typeof item.playerCount === 'number' ? item.playerCount : 0} / 4 Oyuncu`}
                    </Text>
                    {item.isGameStarted && (
                      <View style={styles.gameStatusContainer}>
                        <Ionicons name="play-circle" size={14} color="#4ecdc4" />
                        <Text style={styles.gameStatus}>Oyun Devam Ediyor</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.joinButton, 
                      ((item.playerCount || 0) >= 4 || item.isGameStarted) && styles.joinButtonDisabled
                    ]}
                    onPress={() => handleJoinRoom(item.id)}
                    disabled={(item.playerCount || 0) >= 4 || item.isGameStarted}
                  >
                    <LinearGradient
                      colors={((item.playerCount || 0) >= 4 || item.isGameStarted) 
                        ? ['#95a5a6', '#7f8c8d'] 
                        : ['#4ecdc4', '#44a08d']
                      }
                      style={styles.joinButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons 
                        name={item.isGameStarted ? "play" : "enter"} 
                        size={16} 
                        color="#fff" 
                        style={styles.joinButtonIcon}
                      />
                      <Text style={styles.joinButtonText}>
                        {item.isGameStarted ? 'Oynanıyor' : 'Katıl'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}
              ListHeaderComponent={
                <View style={styles.listHeader}>
                  <Ionicons name="list" size={24} color="#fff" />
                  <Text style={styles.listTitle}>Aktif Odalar</Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="home-outline" size={48} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.emptyText}>Henüz kimse oda kurmamış</Text>
                  <Text style={styles.emptySubtext}>İlk odayı sen kur ve arkadaşlarını davet et!</Text>
                </View>
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        </Animated.View>

        {/* Bottom Navigation */}
        <Animated.View 
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(auth)/home')}>
            <Ionicons name="arrow-back" size={20} color="#fff" style={styles.backButtonIcon} />
            <Text style={styles.backButtonText}>Ana Menü</Text>
          </TouchableOpacity>
        </Animated.View>

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
       </LinearGradient>
     </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 12,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  createButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  createButton: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 15,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    backdropFilter: 'blur(10px)',
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  roomInfo: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  playerCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  gameStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameStatus: {
    fontSize: 12,
    color: '#4ecdc4',
    marginLeft: 4,
    fontWeight: '500',
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  joinButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonIcon: {
    marginRight: 6,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Lobby;
