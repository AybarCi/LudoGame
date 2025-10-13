import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { showAlert } from '../../store/slices/alertSlice';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const colors = [
  { name: 'Kırmızı', value: 'red', color: '#FF4444', icon: 'heart' },
  { name: 'Yeşil', value: 'green', color: '#4CAF50', icon: 'leaf' },
  { name: 'Sarı', value: 'yellow', color: '#FFD700', icon: 'sunny' },
  { name: 'Mavi', value: 'blue', color: '#2196F3', icon: 'water' },
];

const FreeModeScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState({});
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempPlayerNames, setTempPlayerNames] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const particlesAnim = useRef(new Animated.Value(0)).current;

  // Particle animation
  useEffect(() => {
    const particleAnimation = Animated.loop(
      Animated.timing(particlesAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    );
    particleAnimation.start();
    return () => particleAnimation.stop();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
    setSelectedPlayers([]);
    setPlayerNames({});
  };

  const togglePlayerColor = (colorValue) => {
    if (selectedPlayers.includes(colorValue)) {
      setSelectedPlayers(selectedPlayers.filter(p => p !== colorValue));
      // Remove player name when deselecting color
      const newPlayerNames = { ...playerNames };
      delete newPlayerNames[colorValue];
      setPlayerNames(newPlayerNames);
    } else if (selectedPlayers.length < playerCount) {
      const newSelectedPlayers = [...selectedPlayers, colorValue];
      setSelectedPlayers(newSelectedPlayers);
      
      // If all players are selected, open name modal
      if (newSelectedPlayers.length === playerCount) {
        // Initialize temp names with defaults
        const tempNames = {};
        newSelectedPlayers.forEach((color, index) => {
          tempNames[color] = `Oyuncu ${index + 1}`;
        });
        setTempPlayerNames(tempNames);
        setShowNameModal(true);
      }
    }
  };

  const updateTempPlayerName = (colorValue, name) => {
    setTempPlayerNames(prev => ({
      ...prev,
      [colorValue]: name
    }));
  };

  const handleSaveNames = () => {
    // Check if all names are filled
    const hasEmptyNames = selectedPlayers.some(color => 
      !tempPlayerNames[color] || tempPlayerNames[color].trim() === ''
    );
    
    if (hasEmptyNames) {
      showAlertMessage('Hata', 'Lütfen tüm oyuncular için isim girin.');
      return;
    }

    // Save names and close modal
    setPlayerNames(tempPlayerNames);
    setShowNameModal(false);
  };

  const handleCloseModal = () => {
    setShowNameModal(false);
    // Reset temp names
    setTempPlayerNames({});
  };

  const showAlertMessage = (title, message, type = 'error') => {
    dispatch(showAlert({ title, message, type }));
  };

  const handleStartGame = async () => {
    if (selectedPlayers.length !== playerCount) {
      showAlertMessage('Hata', 'Lütfen tüm oyuncular için renk seçin.');
      return;
    }

    // Check if names are set (should be set via modal)
    if (Object.keys(playerNames).length === 0) {
      showAlertMessage('Hata', 'Lütfen oyuncu isimlerini girin.');
      return;
    }

    try {
      // Free mode - no energy required
      // Navigate to free mode game with selected parameters
      const gameParams = {
        playerCount: playerCount.toString(),
        playerColors: JSON.stringify(selectedPlayers),
        playerNames: JSON.stringify(playerNames)
      };
      
      router.push({
        pathname: '/(auth)/freemodegame',
        params: gameParams
      });
    } catch (_error) {
      console.error('Error starting game:', _error);
      showAlertMessage('Hata', 'Oyun başlatılırken bir hata oluştu.');
    }
  };

  const goBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated Particles */}
        <View style={styles.particlesContainer}>
          {[...Array(6)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  left: `${20 + (i * 15)}%`,
                  top: `${10 + (i * 12)}%`,
                  transform: [
                    {
                      translateY: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -20 - (i * 10)]
                      })
                    },
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1]
                      })
                    }
                  ],
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.3, 0.1]
                  })
                }
              ]}
            />
          ))}
        </View>

        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={goBack}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color="#00d4ff" />
          </TouchableOpacity>
          
          <Animated.View style={[styles.headerTitleContainer, { opacity: fadeAnim }]}>
            <Text style={styles.headerTitle}>SERBEST MOD</Text>
          </Animated.View>
          
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Modern Title Section */}
            <View style={styles.titleContainer}>
              <Animated.View
                style={[
                  styles.titleIconContainer,
                  {
                    transform: [
                      {
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1]
                        })
                      }
                    ]
                  }
                ]}
              >
                <Ionicons name="people" size={isTablet ? 48 : 40} color="#00d4ff" />
              </Animated.View>
              <Text style={styles.title}>SERBEST MOD</Text>
              <Text style={styles.subtitle}>
                Aynı cihazda arkadaşlarınla birlikte oynayın
              </Text>
            </View>

            {/* Player Count Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>OYUNCU SAYISI</Text>
              <View style={styles.playerCountContainer}>
                {[2, 3, 4].map((count, index) => (
                  <Animated.View
                    key={count}
                    style={[
                      styles.playerCountButtonWrapper,
                      {
                        transform: [
                          {
                            translateY: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [50, 0]
                            })
                          }
                        ],
                        opacity: fadeAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 0.5, 1]
                        })
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.playerCountButton,
                        playerCount === count && styles.playerCountButtonActive
                      ]}
                      onPress={() => handlePlayerCountChange(count)}
                      activeOpacity={0.9}
                    >
                      <Text style={[
                        styles.playerCountText,
                        playerCount === count && styles.playerCountTextActive
                      ]}>
                        {count}
                      </Text>
                      <Text style={[
                        styles.playerCountSubText,
                        playerCount === count && styles.playerCountSubTextActive
                      ]}>
                        Oyuncu
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                RENK SEÇİMİ ({selectedPlayers.length}/{playerCount})
              </Text>
              <View style={styles.colorGrid}>
                {colors.slice(0, playerCount).map((colorItem) => {
                  const isSelected = selectedPlayers.includes(colorItem.value);
                  const isDisabled = !isSelected && selectedPlayers.length >= playerCount;
                  
                  return (
                    <Animated.View
                      key={colorItem.value}
                      style={[
                        styles.colorButtonWrapper,
                        {
                          transform: [
                            {
                              translateY: fadeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [30, 0]
                              })
                            }
                          ],
                          opacity: fadeAnim.interpolate({
                            inputRange: [0, 0.7, 1],
                            outputRange: [0, 0.7, 1]
                          })
                        }
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.colorButton,
                          { backgroundColor: colorItem.color },
                          isSelected && styles.colorButtonSelected,
                          isDisabled && styles.colorButtonDisabled
                        ]}
                        onPress={() => togglePlayerColor(colorItem.value)}
                        disabled={isDisabled}
                        activeOpacity={0.9}
                      >
                        <Animated.View
                          style={[
                            styles.colorIconContainer,
                            isSelected && {
                              transform: [
                                {
                                  scale: fadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.1]
                                  })
                                }
                              ]
                            }
                          ]}
                        >
                          <Ionicons 
                            name={colorItem.icon} 
                            size={isTablet ? 40 : 30} 
                            color="white" 
                          />
                        </Animated.View>
                        <Text style={styles.colorButtonText}>{colorItem.name}</Text>
                        {isSelected && (
                          <Animated.View
                            style={[
                              styles.selectedIndicator,
                              {
                                opacity: fadeAnim.interpolate({
                                  inputRange: [0, 0.5, 1],
                                  outputRange: [0, 0, 1]
                                })
                              }
                            ]}
                          >
                            <Ionicons name="checkmark" size={24} color="white" />
                          </Animated.View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>

            {/* Game Rules */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Oyun Kuralları</Text>
              <View style={styles.rulesContainer}>
                <View style={styles.ruleItem}>
                  <Ionicons name="people" size={20} color="#FFD700" />
                  <Text style={styles.ruleText}>
                    Her oyuncu sırayla zar atar
                  </Text>
                </View>
                <View style={styles.ruleItem}>
                  <Ionicons name="refresh" size={20} color="#FFD700" />
                  <Text style={styles.ruleText}>
                    Cihazı oyuncular arasında döndürün
                  </Text>
                </View>
                <View style={styles.ruleItem}>
                  <Ionicons name="tablet-landscape" size={20} color="#FFD700" />
                  <Text style={styles.ruleText}>
                    {isTablet ? 'Tablet' : 'Telefon'} modunda optimize edilmiştir
                  </Text>
                </View>
              </View>
            </View>

            {/* Start Button */}
            <Animated.View
              style={[
                styles.startButtonWrapper,
                {
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [60, 0]
                      })
                    }
                  ],
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 0.8, 1],
                    outputRange: [0, 0.8, 1]
                  })
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.startButton,
                  selectedPlayers.length !== playerCount && styles.startButtonDisabled
                ]}
                onPress={handleStartGame}
                disabled={selectedPlayers.length !== playerCount}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={selectedPlayers.length === playerCount 
                    ? ['#00d4ff', '#0099cc'] 
                    : ['#666', '#444']
                  }
                  style={styles.startButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.startButtonText}>OYUNA BAŞLA</Text>
                  <Ionicons name="play" size={24} color="white" style={styles.startButtonIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
        
        {/* Player Names Modal */}
        <Modal
          visible={showNameModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Ionicons name="people" size={40} color="#FFF" style={styles.modalIcon} />
                  <Text style={styles.modalTitle}>Oyuncu İsimleri</Text>
                  <Text style={styles.modalSubtitle}>Her oyuncu için isim girin</Text>
                </View>
                
                <View style={styles.modalContent}>
                  {selectedPlayers.map((color, index) => {
                    const colorItem = colors.find(c => c.value === color);
                    return (
                      <View key={color} style={styles.modalPlayerRow}>
                        <View style={[styles.modalColorIndicator, { backgroundColor: colorItem.color }]}>
                          <Ionicons name={colorItem.icon} size={24} color="white" />
                        </View>
                        <TextInput
                          style={styles.modalPlayerInput}
                          placeholder={`${colorItem.name} oyuncusunun adı`}
                          placeholderTextColor="rgba(255, 255, 255, 0.6)"
                          value={tempPlayerNames[color] || ''}
                          onChangeText={(text) => updateTempPlayerName(color, text)}
                          maxLength={20}
                          autoFocus={index === 0}
                        />
                      </View>
                    );
                  })}
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={handleCloseModal}
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                      İptal
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={handleSaveNames}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
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
  backgroundGradient: {
    flex: 1,
    paddingHorizontal: isTablet ? 40 : 20,
    paddingTop: isTablet ? 60 : 40,
    paddingBottom: isTablet ? 40 : 20,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(0, 212, 255, 0.6)',
    borderRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#00d4ff',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 212, 255, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 60 : 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: isTablet ? 50 : 40,
  },
  titleIconContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  title: {
    fontSize: isTablet ? 42 : 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 212, 255, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: isTablet ? 16 : 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  sectionContainer: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '700',
    color: 'rgba(0, 212, 255, 0.9)',
    marginBottom: 20,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  playerCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  playerCountButtonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  playerCountButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: isTablet ? 20 : 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  playerCountButtonActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: '#00d4ff',
    borderWidth: 2,
    elevation: 8,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playerCountText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: isTablet ? 28 : 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  playerCountSubText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: isTablet ? 12 : 10,
    fontWeight: '600',
  },
  playerCountTextActive: {
    color: '#00d4ff',
  },
  playerCountSubTextActive: {
    color: 'rgba(0, 212, 255, 0.8)',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: isTablet ? 20 : 15,
  },
  colorButtonWrapper: {
    width: isTablet ? '45%' : '47%',
  },
  colorButton: {
    width: '100%',
    aspectRatio: isTablet ? 1.5 : 1.2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    position: 'relative',
  },
  colorButtonSelected: {
    borderWidth: 2,
    borderColor: 'white',
    elevation: 8,
    shadowColor: 'white',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  colorButtonDisabled: {
    opacity: 0.4,
  },
  colorIconContainer: {
    marginBottom: 8,
  },
  colorButtonText: {
    color: 'white',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  rulesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: isTablet ? 25 : 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ruleText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: isTablet ? 16 : 14,
    marginLeft: 15,
    flex: 1,
    lineHeight: 20,
  },
  startButtonWrapper: {
    marginTop: 30,
  },
  startButton: {
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 22 : 20,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  startButtonText: {
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  startButtonIcon: {
    marginLeft: 10,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: isTablet ? 500 : 350,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalGradient: {
    padding: 25,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  modalIcon: {
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: 25,
  },
  modalPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalColorIndicator: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalPlayerInput: {
    flex: 1,
    color: 'white',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonText: {
    color: 'white',
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
  },
  modalButtonTextSecondary: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default FreeModeScreen;