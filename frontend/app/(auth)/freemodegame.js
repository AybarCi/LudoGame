import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../../store';
import { initializeAuth } from '../../store/slices/authSlice';

import FreeModeBoard from '../../components/modules/FreeModeBoard';
import { useFreeModeEngine } from '../../hooks/useFreeModeEngine';
import { AdService } from '../../services/AdService';
import { showAlert } from '../../store/slices/alertSlice';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

// Ekran boyutuna göre container justifyContent ayarla
const getContainerJustifyContent = () => {
  const minDimension = Math.min(width, height);
  // Büyük ekranlarda içeriği ortala, küçük ekranlarda yukarıdan başla
  return minDimension > 800 ? 'center' : 'flex-start';
};

// Android status bar yüksekliğini hesapla
const getStatusBarHeight = () => {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight || 0;
  }
  return 0;
};

const FreeModeGame = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [energyChecked, setEnergyChecked] = useState(false);
  const [gameInitialized, setGameInitialized] = useState(false);
  
  // Parse game parameters
  const playerCount = parseInt(params.playerCount) || 2;
  const playerColors = JSON.parse(params.playerColors || '["red", "blue"]');
  const playerNames = JSON.parse(params.playerNames || '{}');
  
  // Create playersInfo object for the hook
  const playersInfo = {};
  playerColors.forEach((color, index) => {
    playersInfo[color] = {
      nickname: playerNames[color] || `Oyuncu ${index + 1}`
    };
  });
  
  // Initialize game engine
  const { state, dispatch, getPossibleMoves } = useFreeModeEngine('local', playersInfo);
  
  // Animation values
  const diceRotation = useRef(new Animated.Value(0)).current;
  const diceScale = useRef(new Animated.Value(1)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const reduxDispatch = useDispatch();

  // Initialize game (energy check is done in freemode.js before navigation)
  useEffect(() => {
    setEnergyChecked(true);
    setGameInitialized(true);
  }, []);

  // Get possible moves for current player
  const possibleMoves = state && state.diceValue ? 
    getPossibleMoves(state.pawns, state.currentPlayer, state.diceValue) : [];
  
  // Early return if state is not initialized
  if (!state || !state.isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#FFF', textAlign: 'center', marginTop: 100 }}>Oyun yükleniyor...</Text>
      </View>
    );
  }
  
  // Handle dice roll
  const handleDiceRoll = () => {
    if (state.diceValue !== null || state.winner || state.isRolling) return;
    
    // Start rolling animation
    dispatch({ type: 'START_ROLLING' });
    
    // Animate dice
    Animated.sequence([
      Animated.timing(diceRotation, {
        toValue: 360,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(diceRotation, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true
      })
    ]).start();
    
    Animated.sequence([
      Animated.spring(diceScale, {
        toValue: 1.3,
        useNativeDriver: true
      }),
      Animated.spring(diceScale, {
        toValue: 1,
        useNativeDriver: true
      })
    ]).start();
    
    // Roll dice based on game phase
    setTimeout(() => {
      if (state.gamePhase === 'pre-game') {
        dispatch({ type: 'ROLL_DICE_FOR_TURN_ORDER' });
      } else {
        dispatch({ type: 'ROLL_DICE' });
      }
    }, 500);
  };

  // Handle pawn selection
  const handlePawnPress = (pawnId) => {
    if (!state.diceValue || state.winner) return;
    
    dispatch({ type: 'MOVE_PAWN', payload: { pawnId } });
    
    // Animate message
    Animated.sequence([
      Animated.timing(messageOpacity, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };
  
  // Handle game reset
  const handleReset = () => {
    // Use React Native's Alert API instead of Redux for confirmation dialogs with actions
    Alert.alert(
      'Oyunu Sıfırla',
      'Oyunu sıfırlamak istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Evet',
          onPress: () => dispatch({ type: 'RESET_GAME' })
        }
      ],
      { cancelable: true }
    );
  };
  
  // Handle back to menu
  const handleBackToMenu = () => {
    // Use React Native's Alert API instead of Redux for confirmation dialogs with actions
    Alert.alert(
      'Menüye Dön',
      'Oyundan çıkmak istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Evet',
          onPress: confirmBackToMenu
        }
      ],
      { cancelable: true }
    );
  };
  
  // Confirm back to menu
  const confirmBackToMenu = async () => {
    try {
      // Önce auth state'ini kontrol et
      const currentState = store.getState();
      console.log('confirmBackToMenu: Current auth state:', {
        isAuthenticated: currentState.auth.isAuthenticated,
        hasToken: !!currentState.auth.token,
        hasUser: !!currentState.auth.user
      });
      
      // Eğer authenticated değilsek, token yenilemeyi dene
      if (!currentState.auth.isAuthenticated) {
        console.log('confirmBackToMenu: Not authenticated, attempting to refresh token...');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          // Token yenileme thunk'unu çalıştır
          const result = await dispatch(initializeAuth());
          console.log('confirmBackToMenu: Token refresh result:', result);
          
          // Yeniden kontrol et
          const newState = store.getState();
          if (!newState.auth.isAuthenticated) {
            console.log('confirmBackToMenu: Token refresh failed, redirecting to login');
            router.replace('/login');
            return;
          }
        } else {
          console.log('confirmBackToMenu: No refresh token, redirecting to login');
          router.replace('/login');
          return;
        }
      }
      
      // Auth başarılıysa home'a git
      console.log('confirmBackToMenu: Authentication successful, navigating to home');
      router.replace('/home');
    } catch (error) {
      console.error('confirmBackToMenu: Navigation error:', error);
      // Fallback navigation - en azından login'e git
      router.replace('/login');
    }
  };
  
  // Animated styles
  const diceAnimatedStyle = {
    transform: [
      { rotate: diceRotation.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg']
      })},
      { scale: diceScale }
    ]
  };
  
  // Get current player info
  const currentPlayerName = state.playersInfo[state.currentPlayer]?.nickname || state.currentPlayer;
  const currentPlayerColor = state.currentPlayer;

  // Show winner alert when winner is determined
  React.useEffect(() => {
    if (state.winner) {
      // Use React Native's Alert API for winner notification with actions
      Alert.alert(
        '🎉 Tebrikler! 🎉',
        `${state.playersInfo[state.winner]?.nickname || state.winner} oyunu kazandı!`,
        [
          {
            text: 'Tekrar Oyna',
            onPress: async () => {
              try {
                await AdService.showInterstitialAd();
                dispatch({ type: 'RESET_GAME' });
              } catch (error) {
                console.error('Ad failed, proceeding anyway:', error);
                dispatch({ type: 'RESET_GAME' });
              }
            }
          },
          {
            text: 'Ana Menü',
            onPress: async () => {
              try {
                await AdService.showInterstitialAd();
                router.replace('/(auth)/home');
              } catch (error) {
                console.error('Ad failed, proceeding anyway:', error);
                router.push('/(auth)/home');
              }
            }
          }
        ],
        { cancelable: false }
      );
    }
  }, [state.winner]);
  
  // Player colors for UI
  const playerColorMap = {
    red: ['#FF6B6B', '#FF5252'],
    blue: ['#4FC3F7', '#2196F3'],
    green: ['#81C784', '#4CAF50'],
    yellow: ['#FFD54F', '#FFC107']
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToMenu} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Serbest Mod</Text>
          
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Ionicons name="refresh" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        

        
        {/* Turn Order Display - Only show during pre-game */}
        {state.gamePhase === 'pre-game' && state.turnOrderRolls.length > 0 && (
          <View style={styles.turnOrderContainer}>
            <Text style={styles.turnOrderTitle}>Sıralama Sonuçları</Text>
            <View style={styles.turnOrderList}>
              {state.turnOrderRolls.map((roll, index) => {
                const playerColor = roll.color;
                const playerName = state.playersInfo[playerColor]?.nickname || playerColor;
                return (
                  <View key={index} style={styles.turnOrderItem}>
                    <LinearGradient
                      colors={playerColorMap[playerColor]}
                      style={styles.turnOrderGradient}
                    >
                      <Text style={styles.turnOrderPlayerName}>{playerName}</Text>
                      <Text style={styles.turnOrderDiceValue}>{roll.roll}</Text>
                    </LinearGradient>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        
        {/* Game Board - Only show during playing phase */}
        {state.gamePhase === 'playing' && (
          <View style={styles.boardContainer}>
            <FreeModeBoard
              pawns={state.pawns}
              onPawnPress={handlePawnPress}
              currentPlayer={state.currentPlayer}
              possibleMoves={possibleMoves}
              playersInfo={state.playersInfo}
            />
          </View>
        )}
        
        {/* Pre-game Controls - Only show during pre-game */}
        {state.gamePhase === 'pre-game' && (
          <View style={styles.preGameControls}>
            <View style={styles.playerInfo}>
              <LinearGradient
                colors={playerColorMap[currentPlayerColor]}
                style={styles.playerIndicator}
              >
                <Text style={styles.playerName}>{currentPlayerName}</Text>
                <Text style={styles.playerLabel}>Sıradaki Oyuncu</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.diceSection}>
              <Animated.View style={[styles.diceContainer, diceAnimatedStyle]}>
                <TouchableOpacity
                  onPress={handleDiceRoll}
                  disabled={state.diceValue !== null || state.isRolling}
                  style={[
                    styles.diceButton,
                    {
                      opacity: (!state.diceValue && !state.isRolling) ? 1 : 0.6
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA000']}
                    style={styles.diceGradient}
                  >
                    <Text style={styles.diceText}>
                      {state.diceValue || '🎲'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              
              <Text style={styles.diceLabel}>
                {!state.diceValue && !state.isRolling ? 'Sıralama için zar at!' : 'Bekle...'}
              </Text>
            </View>
          </View>
        )}

        {/* Game Controls - Only show during playing phase */}
        {state.gamePhase === 'playing' && (
          <View style={styles.controlsContainer}>
            {/* Current Player Info */}
            <View style={styles.playerInfo}>
              <LinearGradient
                colors={playerColorMap[currentPlayerColor]}
                style={styles.playerIndicator}
              >
                <Text style={styles.playerName}>{currentPlayerName}</Text>
                <Text style={styles.playerLabel}>Sıradaki Oyuncu</Text>
              </LinearGradient>
            </View>
            
            {/* Dice Section */}
            <View style={styles.diceSection}>
              <Animated.View style={[styles.diceContainer, diceAnimatedStyle]}>
                <TouchableOpacity
                  onPress={handleDiceRoll}
                  disabled={state.diceValue !== null || state.winner || state.isRolling}
                  style={[
                    styles.diceButton,
                    {
                      opacity: (!state.diceValue && !state.winner && !state.isRolling) ? 1 : 0.6
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA000']}
                    style={styles.diceGradient}
                  >
                    <Text style={styles.diceText}>
                      {state.diceValue || '🎲'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              
              <Text style={styles.diceLabel}>
                {!state.diceValue && !state.winner && !state.isRolling ? 'Zar At!' : 
                 state.diceValue && possibleMoves.length > 0 ? `${possibleMoves.length} hamle mümkün - Piyon seçin!` : 
                 state.diceValue && possibleMoves.length === 0 ? 'Hamle yok - Bekle...' : 'Bekle...'}
              </Text>
            </View>

          </View>
        )}
        

        
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: Platform.OS === 'android' ? getStatusBarHeight() : 0, // Android'de status bar yüksekliği kadar padding
    justifyContent: getContainerJustifyContent(), // Ekran boyutuna göre ortala veya üstten başla
  },
  gradient: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: isTablet ? 8 : 6, // Header'ı biraz daha büyült
    paddingTop: isTablet ? 8 : 6,
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  headerTitle: {
    fontSize: isTablet ? 24 : 20, // Daha küçük font
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center'
  },
  resetButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  turnOrderContainer: {
    marginHorizontal: 20,
    marginBottom: 10
  },
  turnOrderTitle: {
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.9
  },
  turnOrderList: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4 // Izgara görünümünü düzelt
  },
  turnOrderItem: {
    minWidth: isTablet ? 90 : 70 // Izgara görünümünü düzelt
  },
  turnOrderGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    elevation: 3,
    alignItems: 'center'
  },
  turnOrderPlayerName: {
    fontSize: isTablet ? 12 : 10,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center'
  },
  turnOrderDiceValue: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center'
  },
  boardContainer: {
    flex: 1.3, // Board'a DAHA AZ alan ver
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingBottom: 5,
    marginBottom: -45, // Board'ı BİR TIK DAHA YUKARI taşı
    minHeight: isTablet ? 460 : 320,
  },
  preGameControls: {
    flex: 1.2, // DAHA DAHA FAZLA alan kaplasın
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 5,
    marginTop: -35, // BİR TIK DAHA YUKARI kaydır
  },
  controlsContainer: {
    flex: 0.8,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 5, // DAHA DA YUKARI taşı
    marginTop: -15, // Yukarı kaydır
  },
  playerInfo: {
    marginBottom: 2 // DAHA DA YUKARI KAYDIR
  },
  playerIndicator: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3
  },
  playerName: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center'
  },
  playerLabel: {
    fontSize: isTablet ? 14 : 12,
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.9
  },
  diceSection: {
    alignItems: 'center',
    marginVertical: 2 // DAHA DA YUKARI KAYDIR
  },
  diceContainer: {
    marginBottom: 10
  },
  diceButton: {
    width: isTablet ? 80 : 70,
    height: isTablet ? 80 : 70,
    borderRadius: isTablet ? 40 : 35
  },
  diceGradient: {
    flex: 1,
    borderRadius: isTablet ? 40 : 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8
  },
  diceText: {
    fontSize: isTablet ? 32 : 28,
    fontWeight: 'bold',
    color: '#FFF'
  },
  diceLabel: {
    fontSize: isTablet ? 16 : 14,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
    minHeight: isTablet ? 48 : 40,
    lineHeight: isTablet ? 24 : 20,
    paddingVertical: 4
  },
  statsContainer: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-around'
  },
  statItem: {
    flex: isTablet ? 1 : undefined,
    marginHorizontal: isTablet ? 5 : 0,
    marginVertical: isTablet ? 0 : 3
  },
  statGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2
  },
  statName: {
    fontSize: isTablet ? 14 : 12,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center'
  },
  statValue: {
    fontSize: isTablet ? 12 : 10,
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.9
  },


});

export default FreeModeGame;