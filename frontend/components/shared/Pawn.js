import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/game';

const Pawn = ({ color, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.pawn, { backgroundColor: COLORS[color] }]}>
        <View style={[styles.pawnInner, { backgroundColor: COLORS.white, opacity: 0.3 }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pawn: {
    width: '70%',
    height: '70%',
    borderRadius: 50, // Make it a circle
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pawnInner: {
    width: '40%',
    height: '40%',
    borderRadius: 50,
  },
});

export default Pawn;
