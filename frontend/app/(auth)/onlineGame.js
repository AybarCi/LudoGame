import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, TouchableOpacity, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOnlineGameEngine } from '../../hooks/useOnlineGameEngine';
import GameBoard from '../../components/modules/GameBoard';

const OnlineGameScreen = () => {
  const router = useRouter();
  const { roomId } = useLocalSearchParams();
  const { state, socket } = useOnlineGameEngine(roomId);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const intervalRef = useRef(null);

  const handleTimeoutModalClose = useCallback(() => {
    // Simply navigate. The component unmount will clean up everything, including the modal.
    setShowTimeoutModal(false);
    // Use a short timeout to allow the modal to close before navigating
    setTimeout(() => {
      router.replace('/lobby');
    }, 100);
  }, [router]);

  useEffect(() => {
    // Always clear previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const isWaitingAndAlone = state.gamePhase === 'waiting' && state.players.length === 1;

    if (isWaitingAndAlone) {
      let countdown = 0;
      intervalRef.current = setInterval(() => {
        countdown++;
        if (countdown >= 60) {
          setShowTimeoutModal(true);
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.gamePhase, state.players.length]);

  // This useEffect handles the cleanup when the component unmounts.
  useEffect(() => {
    return () => {
      if (socket && roomId) {
        console.log(`Leaving room ${roomId}...`);
        socket.emit('leave_room', { roomId });
      }
    };
  }, [socket, roomId]);






  if (!state || state.gamePhase === 'connecting') {
    return (
        <ImageBackground source={require('../../assets/images/wood-background.png')} style={styles.background}>
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Odaya bağlanılıyor...</Text>
            </View>
        </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/wood-background.png')} style={styles.background}>
            <View style={styles.boardContainer}>
        <GameBoard
          pawns={state.board || []}
          diceValue={state.dice}
          onRoll={() => socket.emit('roll_dice')}
          onPawnPress={(pawn) => socket.emit('move_piece', { piece: pawn })}
          currentPlayer={state.activePlayer}
          validMoves={state.validMoves || []}
          isMyTurn={state.isMyTurn}
          players={state.players || []}
        />
        {state.gamePhase === 'waiting' && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Oyuncular bekleniyor...</Text>
            <Text style={styles.roomIdText}>Oda ID: {roomId}</Text>
          </View>
        )}
      </View>

      <Modal
        transparent={true}
        animationType="slide"
        visible={showTimeoutModal}
        onRequestClose={handleTimeoutModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Oda Kapatıldı</Text>
            <Text style={styles.modalText}>Kimse gelmediği için bekleme süresi doldu.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleTimeoutModalClose}>
              <Text style={styles.modalButtonText}>Lobiye Dön</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardContainer: {
    width: '100%',
    height: 'auto',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  loadingText: {
      marginTop: 20,
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: 'bold',
  },
  waitingContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // Ensure it's on top of the board
  },
  waitingText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  roomIdText: {
    fontSize: 16,
    color: '#DDDDDD',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    color: '#555',
  },
  modalButton: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    elevation: 2,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default OnlineGameScreen;
