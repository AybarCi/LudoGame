import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';

import FreeModeBoard from '../../components/modules/FreeModeBoard';
import { useFreeModeEngine } from '../../hooks/useFreeModeEngine';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

const FreeModeGame = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
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
  const diceRotation = useSharedValue(0);
  const diceScale = useSharedValue(1);
  const messageOpacity = useSharedValue(1);
  
  // Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);

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
    diceRotation.value = withSequence(
      withTiming(360, { duration: 500 }),
      withTiming(0, { duration: 0 })
    );
    diceScale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    
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
    messageOpacity.value = withSequence(
      withTiming(0.5, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  };
  
  // Handle game reset
  const handleReset = () => {
    setShowResetModal(true);
  };
  
  // Handle back to menu
  const handleBackToMenu = () => {
    setShowBackModal(true);
  };
  
  // Confirm reset
  const confirmReset = () => {
    dispatch({ type: 'RESET_GAME' });
    setShowResetModal(false);
  };
  
  // Confirm back to menu
  const confirmBackToMenu = () => {
    router.replace('/');
    setShowBackModal(false);
  };
  
  // Animated styles
  const diceAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${diceRotation.value}deg` },
        { scale: diceScale.value }
      ]
    };
  });
  
  const messageAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: messageOpacity.value
    };
  });
  
  // Get current player info
  const currentPlayerName = state.playersInfo[state.currentPlayer]?.nickname || state.currentPlayer;
  const currentPlayerColor = state.currentPlayer;
  
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
        
        {/* Game Message */}
        <Animated.View style={[styles.messageContainer, messageAnimatedStyle]}>
          <LinearGradient
            colors={playerColorMap[currentPlayerColor]}
            style={styles.messageGradient}
          >
            <Text style={styles.messageText}>{state.gameMessage}</Text>
          </LinearGradient>
        </Animated.View>
        
        {/* Game Board */}
        <View style={styles.boardContainer}>
          <FreeModeBoard
            pawns={state.pawns}
            onPawnPress={handlePawnPress}
            currentPlayer={state.currentPlayer}
            possibleMoves={possibleMoves}
            playersInfo={state.playersInfo}
          />
        </View>
        
        {/* Game Controls */}
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
              {!state.diceValue && !state.winner && !state.isRolling ? 'Zar At!' : 'Bekle...'}
            </Text>
          </View>
        </View>
        
        {/* Reset Confirmation Modal */}
        <Modal
          visible={showResetModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowResetModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.modalGradient}
              >
                <Ionicons name="refresh-circle" size={60} color="#FFF" style={styles.modalIcon} />
                <Text style={styles.modalTitle}>Oyunu Sıfırla</Text>
                <Text style={styles.modalMessage}>
                  Oyunu yeniden başlatmak istediğinizden emin misiniz?
                </Text>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => setShowResetModal(false)}
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                      İptal
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={confirmReset}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>Sıfırla</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
        
        {/* Back to Menu Confirmation Modal */}
        <Modal
          visible={showBackModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBackModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.modalGradient}
              >
                <Ionicons name="home-outline" size={60} color="#FFF" style={styles.modalIcon} />
                <Text style={styles.modalTitle}>Ana Menüye Dön</Text>
                <Text style={styles.modalMessage}>
                  Oyunu bırakıp ana menüye dönmek istediğinizden emin misiniz?
                </Text>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => setShowBackModal(false)}
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>
                      İptal
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={confirmBackToMenu}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>Ana Menü</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
        
        {/* Winner Modal */}
        {state.winner && (
          <View style={styles.winnerOverlay}>
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.9)']}
              style={styles.winnerBackground}
            >
              <View style={styles.winnerModal}>
                <LinearGradient
                  colors={playerColorMap[state.winner]}
                  style={styles.winnerGradient}
                >
                  <Text style={styles.winnerTitle}>🎉 Tebrikler! 🎉</Text>
                  <Text style={styles.winnerName}>
                    {state.playerNames[state.winner] || state.winner}
                  </Text>
                  <Text style={styles.winnerSubtitle}>Oyunu Kazandı!</Text>
                  
                  <View style={styles.winnerButtons}>
                    <TouchableOpacity
                      onPress={() => dispatch({ type: 'RESET_GAME' })}
                      style={styles.winnerButton}
                    >
                      <Text style={styles.winnerButtonText}>Tekrar Oyna</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => router.replace('/home')}
                      style={[styles.winnerButton, styles.winnerButtonSecondary]}
                    >
                      <Text style={[styles.winnerButtonText, styles.winnerButtonTextSecondary]}>
                        Ana Menü
                      </Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </LinearGradient>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e'
  },
  gradient: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: isTablet ? 20 : 10
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center'
  },
  resetButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  messageContainer: {
    marginHorizontal: 20,
    marginVertical: 10
  },
  messageGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    elevation: 5
  },
  messageText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center'
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 30
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10
  },
  playerInfo: {
    marginBottom: 15
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
    marginBottom: 20
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
    fontWeight: '600'
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
  winnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  winnerBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  winnerModal: {
    width: isTablet ? '50%' : '80%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20
  },
  winnerGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  winnerTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10
  },
  winnerName: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5
  },
  winnerSubtitle: {
    fontSize: isTablet ? 18 : 16,
    color: '#FFF',
    marginBottom: 20,
    opacity: 0.9
  },
  winnerButtons: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 10
  },
  winnerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: isTablet ? 120 : 100
  },
  winnerButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  winnerButtonText: {
    color: '#FFF',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  winnerButtonTextSecondary: {
    opacity: 0.8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: isTablet ? '40%' : '85%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  modalGradient: {
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: 'center'
  },
  modalIcon: {
    marginBottom: 15
  },
  modalTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center'
  },
  modalMessage: {
    fontSize: isTablet ? 16 : 14,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 25,
    opacity: 0.9,
    lineHeight: isTablet ? 24 : 20
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15
  },
  modalButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: isTablet ? 100 : 80,
    elevation: 3
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  modalButtonTextSecondary: {
    opacity: 0.8
  }
});

export default FreeModeGame;