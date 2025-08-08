import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const SWIPE_THRESHOLD = width * 0.25;

const RotatingStatsCard = ({ stats }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [nextCardOpacity] = useState(new Animated.Value(0));
  const [prevCardOpacity] = useState(new Animated.Value(0));

  const animateCardTransition = (direction) => {
    const isNext = direction === 'next';
    const targetRotateY = isNext ? -180 : 180;
    const targetTranslateX = isNext ? -width : width;
    
    // Start the flip animation
    Animated.parallel([
      Animated.timing(rotateY, {
        toValue: targetRotateY,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: targetTranslateX,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Update index
      const newIndex = isNext 
        ? (currentIndex + 1) % stats.length
        : currentIndex === 0 ? stats.length - 1 : currentIndex - 1;
      
      setCurrentIndex(newIndex);
      
      // Reset animations for new card
      rotateY.setValue(targetRotateY);
      translateX.setValue(targetTranslateX);
      opacity.setValue(0);
      scale.setValue(0.8);
      
      // Animate new card in
      Animated.parallel([
        Animated.spring(rotateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const rotateToNext = () => {
    if (!isGestureActive) {
      animateCardTransition('next');
    }
  };

  const rotateToPrev = () => {
    if (!isGestureActive) {
      animateCardTransition('prev');
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderGrant: () => {
      setIsGestureActive(true);
    },
    onPanResponderMove: (evt, gestureState) => {
      const { dx } = gestureState;
      const progress = Math.abs(dx) / SWIPE_THRESHOLD;
      const clampedProgress = Math.min(progress, 1);
      
      // Update translateX
      translateX.setValue(dx);
      
      // Add rotation based on swipe direction and progress
      const rotationValue = (dx / width) * 30; // Max 30 degrees
      rotateY.setValue(rotationValue);
      
      // Scale down slightly during swipe
      const scaleValue = 1 - (clampedProgress * 0.1);
      scale.setValue(scaleValue);
      
      // Show preview of next/prev card
      if (dx > 50) {
        // Swiping right - show previous card
        prevCardOpacity.setValue(clampedProgress * 0.6);
        nextCardOpacity.setValue(0);
      } else if (dx < -50) {
        // Swiping left - show next card
        nextCardOpacity.setValue(clampedProgress * 0.6);
        prevCardOpacity.setValue(0);
      } else {
        nextCardOpacity.setValue(0);
        prevCardOpacity.setValue(0);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      setIsGestureActive(false);
      
      const { dx, vx } = gestureState;
      const shouldSwipe = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.8;
      
      // Hide preview cards
      Animated.parallel([
        Animated.timing(nextCardOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(prevCardOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      if (shouldSwipe) {
        if (dx > 0 || vx > 0) {
          // Swipe right - go to previous
          animateCardTransition('prev');
        } else {
          // Swipe left - go to next
          animateCardTransition('next');
        }
      } else {
        // Snap back to center
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(rotateY, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          })
        ]).start();
      }
    },
  });



  const handlePress = () => {
    const currentStat = stats[currentIndex];
    
    // If current stat has onPress, execute it
    if (currentStat.onPress) {
      currentStat.onPress();
    }
  };

  const currentStat = stats[currentIndex];

  if (!currentStat) return null;

  return (
    <View style={styles.outerContainer}>
      {/* Left Arrow */}
      {stats.length > 1 && (
        <TouchableOpacity 
          style={styles.arrowContainer}
          onPress={() => animateCardTransition('prev')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      
      {/* Main card */}
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [
              { translateX },
              { rotateY: rotateY.interpolate({
                inputRange: [-180, 0, 180],
                outputRange: ['-180deg', '0deg', '180deg']
              })},
              { scale }
            ],
            opacity
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={styles.touchable} 
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={currentStat.gradient || ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={currentStat.icon} 
                  size={28} 
                  color={currentStat.iconColor || '#FFD700'} 
                />
              </View>
              
              <Text style={[styles.value, { color: currentStat.valueColor || '#FFFFFF' }]}>
                {currentStat.value}
              </Text>
              
              <Text style={styles.label}>
                {currentStat.label}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Right Arrow */}
      {stats.length > 1 && (
        <TouchableOpacity 
          style={styles.arrowContainer}
          onPress={() => animateCardTransition('next')}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    padding: 8,
  },
  container: {
    width: 280,
    height: 140,
    marginHorizontal: 10,
  },
  touchable: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },

});

export default RotatingStatsCard;