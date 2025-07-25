import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const GameHUD = ({ onRollDice, diceValue, isMyTurn, message, onLeaveGame }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity 
        onPress={onRollDice} 
        disabled={!isMyTurn} 
        style={[styles.diceButton, !isMyTurn && styles.disabledButton]}>
        <Text style={styles.diceText}>{diceValue || '🎲'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onLeaveGame} style={styles.leaveButton}>
        <Text style={styles.leaveButtonText}>Oyundan Çık</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  diceButton: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'black',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  diceText: {
    fontSize: 50,
    fontWeight: 'bold',
  },
  leaveButton: {
    marginTop: 20,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#c0392b',
  },
  leaveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GameHUD;
