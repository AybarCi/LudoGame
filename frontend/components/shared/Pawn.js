import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { COLORS } from '../../constants/game';

const Pawn = ({ color, onPress }) => {
  const pawnColor = COLORS[color] || COLORS.default;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.pawnWrapper}>
        <Svg height="100%" width="100%" viewBox="0 0 24 24">
          <Path
            d="M22.5 9c-1.79 0-3.34.89-4.25 2.25C17.43 8.67 14.9 7 12 7s-5.43 1.67-6.25 4.25C4.84 9.89 3.29 9 1.5 9C.67 9 0 9.67 0 10.5v1c0 .64.41 1.18.98 1.41C1.39 14.48 3 16.5 3 18.5V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-2.5c0-2 1.61-4.02 2.02-5.09.57-.23.98-.77.98-1.41v-1c0-.83-.67-1.5-1.5-1.5z"
            fill={pawnColor}
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={1}
          />
        </Svg>
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
  pawnWrapper: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.3)',
    elevation: 5, // for Android
  },
});

export default Pawn;
