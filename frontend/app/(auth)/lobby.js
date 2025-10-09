import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ImageBackground, Modal, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { EnergyService } from '../../services/EnergyService';
import useEnergy from '../../hooks/useEnergy';
import { showAlert } from '@/store/slices/alertSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { useSocket } from '@/store/SocketProvider';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const Lobby = () => {
  const { socket } = useSocket();
  const user = useSelector(state => state.auth.user);
  
  // Extract actual user object if it's wrapped in success property
  const actualUser = user?.success && user?.user ? user.user : user;
  const router = useRouter();
  const dispatch = useDispatch();
  const [rooms, setRooms] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showSelfJoinModal, setShowSelfJoinModal] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [energyInfo, setEnergyInfo] = useState(null);
  const { energy: currentEnergy, maxEnergy, loadEnergy, hasEnoughEnergy, useEnergy: useEnergyFunc } = useEnergy();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonAnims = useRef(
    Array.from({ length: 10 }, () => new Animated.Value(0))
  ).current;

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
    // Sadece socket durumu değiştiğinde log at
    if (socket && socket.connected) {
      console.log('[Lobby] Socket connected, setting up listeners...');
    }
    
    if (!socket) {
      setIsLoading(false);
      return;
    }

    const handleUpdateRooms = (roomsArray) => {
      const roomsObject = roomsArray.reduce((acc, room) => {
        acc[room.id] = room;
        return acc;
      }, {});
      setRooms(roomsObject);
      setIsLoading(false);
    };

    const handlePlayerJoined = (room) => {
      setRooms(prevRooms => ({ ...prevRooms, [room.id]: room }));
    };

    const handlePlayerLeft = (room) => {
      setRooms(prevRooms => ({ ...prevRooms, [room.id]: room }));
    };

    const handleGameStarted = (room) => {
      if (room && room.players && room.players.some(p => p.id === socket.id)) {
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
    socket.emit('get_rooms', (roomsArray) => {
      if (roomsArray && Array.isArray(roomsArray)) {
        const roomsObject = roomsArray.reduce((acc, room) => {
          acc[room.id] = room;
          return acc;
        }, {});
        setRooms(roomsObject);
      } else {
        setRooms({});
      }
      setIsLoading(false);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('update_rooms', handleUpdateRooms);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('game_started', handleGameStarted);
    };
  }, [socket?.id, router]); // Sadece socket ID değiştiğinde çalışsın

  // Animation effect - sadece ilk render'da çalışsın
  useEffect(() => {
    // Main content animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Button animations - staggered
      buttonAnims.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          delay: 200 + (index * 100),
          useNativeDriver: true,
        }).start();
      });
    });
  }, []); // Sadece ilk render'da çalışsın

  // Load energy once on mount
  useEffect(() => {
    loadEnergy();
  }, []); // Sadece mount sırasında çalışsın

  const handleCreateRoom = async () => {
    if (!socket) return;
    
    // Check energy before creating room
    const hasEnergy = await EnergyService.hasEnoughEnergy();
    if (!hasEnergy) {
      const energyData = await EnergyService.getEnergyInfo();
      setEnergyInfo(energyData);
      setShowEnergyModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      // Get user data from AsyncStorage to extract nickname
      const userData = await AsyncStorage.getItem('user');
      let nickname = 'Guest';
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          nickname = actualUser.nickname || actualUser.name || 'Guest';
        } catch (e) {
          // Silent fail for user data parse
        }
      }
      
      console.log(`[Lobby] Creating room with nickname: ${nickname}`);
      socket.emit('create_room', { nickname }, (response) => {
      setIsLoading(false);
      if (response.success) {
        router.push(`/onlineGame?roomId=${response.room.id}`);
      } else {
        console.error('[Lobby] Create room failed:', response);
        let errorMessage = response.message || 'Bilinmeyen bir hata oluştu.';
        
        // Daha açıklayıcı hata mesajları
        if (errorMessage.includes('UNIQUE KEY') || errorMessage.includes('benzersiz')) {
          errorMessage = 'Bu oda kodu zaten kullanılıyor. Lütfen tekrar deneyin.';
        } else if (errorMessage.includes('Oda oluşturulamadı')) {
          errorMessage = 'Oda oluşturulamadı. Lütfen bir süre sonra tekrar deneyin.';
        }
        
        dispatch(showAlert({
          title: 'Oda Oluşturma Hatası',
          message: errorMessage,
          type: 'error',
          buttons: []
        }));
      }
    });
    } catch (e) {
      console.error('[Storage] Failed to read nickname for create_room.', e);
      setIsLoading(false);
    }
  };

  // Energy modal functions
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}sa ${remainingMinutes}dk ${seconds.toString().padStart(2, '0')}sn`;
    } else if (minutes > 0) {
      return `${minutes}dk ${seconds.toString().padStart(2, '0')}sn`;
    } else {
      return `${seconds}sn`;
    }
  };

  const handleBuyEnergy = async () => {
    try {
      const success = await EnergyService.buyEnergyWithDiamonds();
      if (success) {
        setShowEnergyModal(false);
        dispatch(showAlert({
          title: 'Başarılı',
          message: 'Enerjiniz tamamen doldu!',
          type: 'success',
          buttons: []
        }));
      } else {
        // Close energy modal first, then show alert
        setShowEnergyModal(false);
        // Add a small delay to ensure modal is closed before showing alert
        setTimeout(() => {
          dispatch(showAlert({
            title: 'Yetersiz Elmas',
            message: 'Enerji satın almak için yeterli elmasınız yok. (50 elmas gerekli)',
            type: 'error',
            buttons: []
          }));
        }, 100);
      }
    } catch (error) {
      console.error('Energy purchase error:', error);
      // Close energy modal first, then show alert
      setShowEnergyModal(false);
      setTimeout(() => {
        dispatch(showAlert({
          title: 'Hata',
          message: 'Enerji satın alma işlemi başarısız oldu.',
          type: 'error',
          buttons: []
        }));
      }, 100);
    }
  };

  // Load energy once on mount
  useEffect(() => {
    loadEnergy();
  }, []);

  // Refresh energy info when modal is open and timer reaches zero
  useEffect(() => {
    let interval;
    if (showEnergyModal && energyInfo && energyInfo.timeUntilNext > 0) {
      interval = setInterval(async () => {
        // Decrement the countdown timer
        setEnergyInfo(prev => {
          if (!prev || prev.timeUntilNext <= 1000) {
            return prev;
          }
          return {
            ...prev,
            timeUntilNext: prev.timeUntilNext - 1000
          };
        });

        // Check if timer reached zero (or close to it)
        if (energyInfo.timeUntilNext <= 1000) {
          // Refresh energy data
          try {
            const energyData = await EnergyService.getEnergyInfo();
            setEnergyInfo(energyData);
          } catch (error) {
            // Silent fail for energy refresh
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showEnergyModal, energyInfo?.timeUntilNext]);

  const handleJoinRoom = async (roomId) => {
    if (!socket) return;
    
    // Check energy before joining room
    const hasEnough = await hasEnoughEnergy(1);
    if (!hasEnough) {
      const energyData = await EnergyService.getEnergyInfo();
      setEnergyInfo(energyData);
      setShowEnergyModal(true);
      return;
    }
    
    // Online mod için enerji kullan (AI ve serbest modda enerji yok)
    const energyUsed = await useEnergyFunc(1);
    if (!energyUsed) {
      dispatch(showAlert({
        title: 'Hata',
        message: 'Enerji kullanılırken bir hata oluştu!',
        type: 'error',
        buttons: []
      }));
      return;
    }
    
    try {
      // Get user data from AsyncStorage to extract nickname
      const userData = await AsyncStorage.getItem('user');
      let nickname = 'Guest';
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          nickname = actualUser.nickname || actualUser.name || 'Guest';
        } catch (e) {
          // Silent fail for user data parse
        }
      }
      
      socket.emit('join_room', { roomId, nickname }, (response) => {
      if (response.success) {
        router.push(`/onlineGame?roomId=${roomId}`);
      } else {
        let errorMessage = response.message || 'Bilinmeyen bir hata oluştu.';
        
        // Daha açıklayıcı hata mesajları
        if (errorMessage.includes('UNIQUE KEY') || errorMessage.includes('benzersiz') || errorMessage.includes('zaten bu oyunda')) {
          errorMessage = 'Bu oyunda zaten yer alıyorsunuz.';
          setShowSelfJoinModal(true);
          return; // Self join modal'ı göster
        } else if (errorMessage.includes('Oda bulunamadı')) {
          errorMessage = 'Oda bulunamadı. Oda silinmiş olabilir.';
        } else if (errorMessage.includes('Oda dolu')) {
          errorMessage = 'Oda dolu. Başka bir odaya katılmayı deneyin.';
        }
        
        dispatch(showAlert({
          title: 'Odaya Katılma Hatası',
          message: errorMessage,
          type: 'error',
          buttons: []
        }));
      }
    });
    } catch (e) {
      // Silent fail for join room
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Odalar Yükleniyor...</Text>
      </View>
    );
  }

  const roomList = Object.values(rooms);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
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
            
            {/* Energy Display */}
            <TouchableOpacity 
              style={styles.energyContainer}
              onPress={async () => {
                try {
                  const energyData = await EnergyService.getEnergyInfo();
                  setEnergyInfo(energyData);
                  setShowEnergyModal(true);
                } catch (error) {
                  // Test için varsayılan değerler
                  setEnergyInfo({
                    current: 3,
                    max: 5,
                    timeUntilNext: 300000,
                    costPerGame: 1,
                    diamondCostForFull: 50,
                    rechargeTimeMinutes: 60
                  });
                  setShowEnergyModal(true);
                }
              }}
            >
              <Ionicons 
                name={currentEnergy === 0 ? "battery-dead" : currentEnergy < maxEnergy * 0.3 ? "battery-half-outline" : "battery-half"} 
                size={20} 
                color={currentEnergy === 0 ? "#ff6b6b" : "#fff"} 
              />
              <Text style={[styles.energyText, currentEnergy === 0 && styles.energyTextWarning]}>
                {currentEnergy}/{maxEnergy}
              </Text>
            </TouchableOpacity>
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
                colors={['#6E00B3', '#E61A8D']}
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
                        ? ['#6E00B3', '#4A0080'] 
                        : ['#00D9CC', '#00B8A6']
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
              <Ionicons name="information-circle" size={50} color="#ff6b6b" style={{ marginBottom: 15 }} />
              <Text style={styles.modalTitle}>Zaten Odadasınız</Text>
              <Text style={styles.modalText}>
                Bu odada zaten bulunuyorsunuz. Tekrar katılamazsınız.
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowSelfJoinModal(false)}>
                <Text style={styles.modalButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Energy Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showEnergyModal}
          onRequestClose={() => setShowEnergyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Header with corporate gradient */}
              <LinearGradient
                colors={['#6E00B3', '#E61A8D']}
                style={styles.modalHeaderCorporate}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.headerContent}>
                  <View style={styles.batteryIconContainer}>
                    <Ionicons 
                      name={energyInfo && energyInfo.current > 0 ? "battery-half" : "battery-dead"} 
                      size={28} 
                      color="#fff" 
                    />
                  </View>
                  <Text style={styles.modalTitleCorporate}>Enerji Durumu</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowEnergyModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* Main Content */}
              <View style={styles.modalContent}>
                {energyInfo && (
                  <>
                    {/* Energy Level Display */}
                    <View style={styles.energyDisplayContainer}>
                      <View style={styles.energyCircleContainer}>
                        <LinearGradient
                          colors={energyInfo.current > 2 ? ['#00D9CC', '#00B8A6'] :
                                 energyInfo.current > 0 ? ['#E61A8D', '#B81470'] :
                                 ['#9E9E9E', '#757575']}
                          style={[
                            styles.energyCircle,
                            { 
                              borderColor: energyInfo.current > 2 ? '#4ecdc4' : 
                                         energyInfo.current > 0 ? '#ff6b6b' : '#9E9E9E'
                            }
                          ]}
                        >
                          <Text style={styles.energyNumber}>{energyInfo.current}</Text>
                        </LinearGradient>
                        <Text style={styles.energyMaxText}>/ {energyInfo.max}</Text>
                      </View>
                      
                      <View style={styles.energyInfoContainer}>
                        <Text style={styles.energyStatusText}>
                          {energyInfo.current === energyInfo.max ? 'Dolu' :
                           energyInfo.current > energyInfo.max / 2 ? 'Yüksek' :
                           energyInfo.current > 0 ? 'Düşük' : 'Boş'}
                        </Text>
                        {energyInfo.timeUntilNext > 0 ? (
                          <Text style={styles.nextEnergyTextCorporate}>
                            Sonraki: {formatTime(energyInfo.timeUntilNext)}
                          </Text>
                        ) : energyInfo.current < energyInfo.max ? (
                          <Text style={[styles.nextEnergyTextCorporate, { color: '#4CAF50', fontWeight: 'bold' }]}>
                            ⚡ Enerji geliyor...
                          </Text>
                        ) : (
                          <Text style={[styles.nextEnergyTextCorporate, { color: '#4CAF50', fontWeight: 'bold' }]}>
                            ✓ Maksimum enerji
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Energy Bar */}
                    <View style={styles.energyBarContainerCorporate}>
                      <View style={styles.energyBarBackground}>
                        <LinearGradient
                          colors={energyInfo.current > 2 ? ['#00D9CC', '#00B8A6'] :
                                 energyInfo.current > 0 ? ['#E61A8D', '#B81470'] :
                                 ['#9E9E9E', '#757575']}
                          style={[
                            styles.energyBarFillCorporate,
                            { width: `${(energyInfo.current / energyInfo.max) * 100}%` }
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                      </View>
                      <LinearGradient
                        colors={['#6E00B3', '#E61A8D']}
                        style={styles.percentageBadge}
                      >
                        <Text style={styles.energyPercentage}>
                          {Math.round((energyInfo.current / energyInfo.max) * 100)}%
                        </Text>
                      </LinearGradient>
                    </View>

                    {/* Status Message */}
                    {energyInfo.current === 0 ? (
                      <View style={styles.statusMessageContainer}>
                        <Ionicons name="warning" size={20} color="#ff6b6b" />
                        <Text style={styles.warningTextCorporate}>
                          Enerjiniz bitti! Online oyun oynamak için enerji gerekiyor.
                        </Text>
                      </View>
                    ) : energyInfo.current < 3 ? (
                      <View style={styles.statusMessageContainer}>
                        <Ionicons name="information-circle" size={20} color="#ff6b6b" />
                        <Text style={styles.infoTextCorporate}>
                          Dikkat! Enerjiniz tükenmek üzere.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.statusMessageContainer}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={styles.successTextCorporate}>
                          Harika! Yeterli enerjiniz var.
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalButtonContainerCorporate}>
                <LinearGradient
                  colors={['#f8f9fa', '#e9ecef']}
                  style={styles.secondaryButtonCorporate}
                >
                  <TouchableOpacity
                    style={styles.buttonContentCorporate}
                    onPress={() => setShowEnergyModal(false)}
                  >
                    <Ionicons name="close-circle" size={18} color="#495057" />
                    <Text style={styles.secondaryButtonText}>Kapat</Text>
                  </TouchableOpacity>
                </LinearGradient>
                
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.primaryButtonCorporate}
                >
                  <TouchableOpacity
                    style={styles.buttonContentCorporate}
                    onPress={handleBuyEnergy}
                  >
                    <Text style={styles.primaryButtonText}>Doldur</Text>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceBadgeText}>50</Text>
                      <Ionicons name="diamond" size={12} color="#FFD700" />
                    </View>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
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
    backgroundColor: '#1a1a2e', // Solid koyu mavi-mor arka plan
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
    position: 'relative',
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
    marginTop: 8,
  },
  energyContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(110, 0, 179, 0.3)', // Kurumsal mor renk
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(110, 0, 179, 0.5)',
  },
  energyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  energyTextWarning: {
    color: '#ff6b6b',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Daha az transparan
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Daha az transparan
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 26, 141, 0.3)', // Kurumsal pembe border
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 350,
    backgroundColor: '#fff',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
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
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  energyStatusContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  energyBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  energyBarFill: {
    height: '100%',
    backgroundColor: '#4ecdc4',
    borderRadius: 10,
  },
  energyCountText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextEnergyText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  warningText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButtonPrimary: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginLeft: 10,
  },
  modalButtonSecondary: {
    backgroundColor: '#9E9E9E',
    flex: 1,
    marginRight: 10,
  },
  // Corporate Modal Styles
  modalHeaderCorporate: {
    paddingVertical: 25,
    paddingHorizontal: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batteryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleCorporate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginLeft: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: 25,
    paddingVertical: 25,
    backgroundColor: '#fff',
  },
  energyDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  energyCircleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  energyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  energyNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  energyMaxText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  energyInfoContainer: {
    alignItems: 'flex-end',
  },
  energyStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  nextEnergyTextCorporate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  energyBarContainerCorporate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  energyBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  energyBarFillCorporate: {
    height: '100%',
    borderRadius: 6,
  },
  energyPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  percentageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  statusMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  warningTextCorporate: {
    fontSize: 14,
    color: '#ff6b6b',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  infoTextCorporate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  successTextCorporate: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  modalButtonContainerCorporate: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    paddingBottom: 25,
    paddingTop: 10,
  },
  secondaryButtonCorporate: {
    flex: 1,
    borderRadius: 25,
    marginRight: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  secondaryButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  primaryButtonCorporate: {
    flex: 1,
    borderRadius: 25,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  buttonContentCorporate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  priceBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  priceBadgeText: {
    color: '#495057',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 4,
  },
});

export default Lobby;
