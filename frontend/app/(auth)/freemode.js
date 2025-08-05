import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Text, Button } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthProvider';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

const colors = [
  { name: 'Kırmızı', value: 'red', color: '#FF4444', icon: 'heart' },
  { name: 'Yeşil', value: 'green', color: '#4CAF50', icon: 'leaf' },
  { name: 'Sarı', value: 'yellow', color: '#FFD700', icon: 'sunny' },
  { name: 'Mavi', value: 'blue', color: '#2196F3', icon: 'water' },
];

const FreeModeScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState({});
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempPlayerNames, setTempPlayerNames] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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
  }, []);

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

  const updatePlayerName = (colorValue, name) => {
    setPlayerNames(prev => ({
      ...prev,
      [colorValue]: name || `Oyuncu ${selectedPlayers.indexOf(colorValue) + 1}`
    }));
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
      Alert.alert('Hata', 'Lütfen tüm oyuncular için isim girin.');
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

  const handleStartGame = () => {
    if (selectedPlayers.length !== playerCount) {
      Alert.alert('Hata', 'Lütfen tüm oyuncular için renk seçin.');
      return;
    }

    // Check if names are set (should be set via modal)
    if (Object.keys(playerNames).length === 0) {
      Alert.alert('Hata', 'Lütfen oyuncu isimlerini girin.');
      return;
    }

    // Navigate to free mode game with selected parameters
    const gameParams = {
      playerCount: playerCount.toString(),
      playerColors: JSON.stringify(selectedPlayers),
      playerNames: JSON.stringify(playerNames)
    };
    
    router.push({
      pathname: '/freemodegame',
      params: gameParams
    });
  };

  const goBack = () => {
    router.back();
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/wood-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
        style={styles.gradient}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={goBack}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

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
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Serbest Mod</Text>
              <Text style={styles.subtitle}>
                {isTablet ? 'Tablet' : 'Telefon'} üzerinde arkadaşlarınızla birlikte oynayın
              </Text>
            </View>

            {/* Player Count Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Oyuncu Sayısı</Text>
              <View style={styles.playerCountContainer}>
                {[2, 3, 4].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.playerCountButton,
                      playerCount === count && styles.playerCountButtonActive
                    ]}
                    onPress={() => handlePlayerCountChange(count)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.playerCountText,
                      playerCount === count && styles.playerCountTextActive
                    ]}>
                      {count} Oyuncu
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                Renk Seçimi ({selectedPlayers.length}/{playerCount})
              </Text>
              <View style={styles.colorGrid}>
                {colors.slice(0, playerCount).map((colorItem) => {
                  const isSelected = selectedPlayers.includes(colorItem.value);
                  const isDisabled = !isSelected && selectedPlayers.length >= playerCount;
                  
                  return (
                    <TouchableOpacity
                      key={colorItem.value}
                      style={[
                        styles.colorButton,
                        { backgroundColor: colorItem.color },
                        isSelected && styles.colorButtonSelected,
                        isDisabled && styles.colorButtonDisabled
                      ]}
                      onPress={() => togglePlayerColor(colorItem.value)}
                      disabled={isDisabled}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={colorItem.icon} 
                        size={isTablet ? 40 : 30} 
                        color="white" 
                      />
                      <Text style={styles.colorButtonText}>{colorItem.name}</Text>
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark" size={20} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
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
            <TouchableOpacity
              style={[
                styles.startButton,
                selectedPlayers.length !== playerCount && styles.startButtonDisabled
              ]}
              onPress={handleStartGame}
              disabled={selectedPlayers.length !== playerCount}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedPlayers.length === playerCount 
                  ? ['#4CAF50', '#66BB6A'] 
                  : ['#666', '#888']
                }
                style={styles.startButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="play" size={24} color="white" />
                <Text style={styles.startButtonText}>Oyunu Başlat</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 100,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 60 : 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: isTablet ? 18 : 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  playerCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  playerCountButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    paddingVertical: isTablet ? 15 : 12,
    paddingHorizontal: isTablet ? 25 : 20,
    minWidth: isTablet ? 120 : 100,
    alignItems: 'center',
  },
  playerCountButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  playerCountText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
  },
  playerCountTextActive: {
    color: '#FFD700',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: isTablet ? 20 : 15,
  },
  colorButton: {
    width: isTablet ? '45%' : '47%',
    aspectRatio: isTablet ? 1.5 : 1.2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    position: 'relative',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: 'white',
  },
  colorButtonDisabled: {
    opacity: 0.5,
  },
  colorButtonText: {
    color: 'white',
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
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
  startButton: {
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    marginTop: 20,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isTablet ? 20 : 18,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  startButtonText: {
    color: 'white',
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
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