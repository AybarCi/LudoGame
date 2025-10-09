// DiamondDisplay.js - Elmas gösterimi bileşeni
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DiamondService } from '../../services/DiamondService';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

const DiamondDisplay = ({ onPress, onDiamondPress, showAnimation = false, refreshTrigger }) => {
  const diamonds = useSelector(state => state.diamonds?.count ?? 0);
  const [animatedValue] = useState(new Animated.Value(1));

  useEffect(() => {
    // Sadece ilk yüklemede AsyncStorage'dan okuyup Redux store'una yaz
    const loadInitialDiamonds = async () => {
      const currentDiamonds = await DiamondService.getDiamonds();
      // Burada Redux store'unun güncellenmesi gerekiyorsa parent component'te yapılmalı
    };
    loadInitialDiamonds();
  }, []);

  useEffect(() => {
    if (showAnimation) {
      // Elmas kazanma animasyonu
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showAnimation]);



  const formatDiamondCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress || onDiamondPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.content,
            { transform: [{ scale: animatedValue }] }
          ]}
        >
          <Ionicons 
            name="diamond" 
            size={isTablet ? 24 : 20} 
            color="#9C27B0" 
          />
          <Text style={styles.diamondText}>
            {formatDiamondCount(diamonds)}
          </Text>
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    paddingHorizontal: isTablet ? 16 : 12,
    paddingVertical: isTablet ? 10 : 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diamondText: {
    color: '#FFF',
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
  },
});

export default DiamondDisplay;