import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Animated, Text } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import BrandLogo from './BrandLogos';
import { COLORS } from '../../constants/game';

const AnimatedPawn = ({ color, emoji = '●', onPress, isMoving = false, moveSteps = 0, onMoveComplete, isTeam = false, teamColors = [], isBrand = false, brandLogoType = null }) => {
  const pawnColor = COLORS[color] || COLORS.default;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  // Step-by-step animation effect
  useEffect(() => {
    if (isMoving && moveSteps > 0) {
      // Reset animation
      stepAnim.setValue(0);
      
      // Create step-by-step animation
      const stepAnimations = [];
      for (let i = 0; i < moveSteps; i++) {
        stepAnimations.push(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1.3,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            })
          ])
        );
      }
      
      // Run all step animations in sequence
      Animated.sequence(stepAnimations).start(() => {
        if (onMoveComplete) {
          onMoveComplete();
        }
      });
    }
  }, [isMoving, moveSteps, bounceAnim, stepAnim, onMoveComplete]);

  // Hover effect on press
  const handlePressIn = () => {
    if (!isMoving) {
      Animated.spring(bounceAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isMoving) {
      Animated.spring(bounceAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
      disabled={isMoving}
    >
      <Animated.View 
        style={[
          styles.pawnWrapper,
          {
            transform: [{ scale: bounceAnim }]
          }
        ]}
      >
        {isBrand && brandLogoType ? (
          <View style={styles.emojiContainer}>
            <BrandLogo type={brandLogoType} size={22} />
          </View>
        ) : emoji === '●' ? (
          <Svg height="84%" width="84%" viewBox="0 0 24 24">
            <Path
              d="M22.5 9c-1.79 0-3.34.89-4.25 2.25C17.43 8.67 14.9 7 12 7s-5.43 1.67-6.25 4.25C4.84 9.89 3.29 9 1.5 9C.67 9 0 9.67 0 10.5v1c0 .64.41 1.18.98 1.41C1.39 14.48 3 16.5 3 18.5V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-2.5c0-2 1.61-4.02 2.02-5.09.57-.23.98-.77.98-1.41v-1c0-.83-.67-1.5-1.5-1.5z"
              fill={pawnColor}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={1}
            />
          </Svg>
        ) : isTeam && teamColors.length >= 2 ? (
          <View style={[styles.teamContainer, { backgroundColor: teamColors[0] }]}> 
            <View style={[styles.teamInner, { backgroundColor: teamColors[1] }]}> 
              <Text style={[styles.teamText, { color: teamColors[0] }]}>⚽</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emojiContainer}>
            <Text style={styles.emojiText}>{emoji}</Text>
          </View>
        )}
        {isMoving && (
          <View style={styles.movingIndicator}>
            <View style={[styles.movingDot, { backgroundColor: pawnColor }]} />
          </View>
        )}
      </Animated.View>
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
    width: '85%', // Piyonları biraz daha büyük
    height: '85%', // Piyonları biraz daha büyük
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
    boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.3)',
    elevation: 5, // for Android
  },
  movingIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emojiContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emojiText: {
    fontSize: 13, // Bir tık daha küçült
    textAlign: 'center',
  },
  teamContainer: {
    width: '85%',
    height: '85%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  teamInner: {
    width: '60%',
    height: '60%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  teamText: {
    fontSize: 14, // iPhone için uygun boyut
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AnimatedPawn;