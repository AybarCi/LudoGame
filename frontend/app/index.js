import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, ImageBackground, Animated, Dimensions } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import DiamondDisplay from '../components/shared/DiamondDisplay';
import DiamondRewardModal from '../components/shared/DiamondRewardModal';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [showDiamondModal, setShowDiamondModal] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ImageBackground source={require('../assets/images/wood-background.png')} style={styles.background}>
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
        style={styles.gradient}
      >
        <View style={styles.container}>
          {/* Elmas Gösterimi */}
          <DiamondDisplay onDiamondPress={() => setShowDiamondModal(true)} />
          
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <View style={styles.logoWrapper}>
              <Image source={require('../assets/images/logo.png')} style={styles.logo} />
              <View style={styles.logoGlow} />
            </View>
            <Text style={styles.title}>LUDO TURCO</Text>
            <Text style={styles.subtitle}>Oyunun Ustası Ol</Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Button
              title="🎮 Oyuna Başla"
              buttonStyle={styles.button}
              titleStyle={styles.buttonTitle}
              onPress={() => router.replace('/login')}
            />
            <View style={styles.buttonGlow} />
          </Animated.View>

          <Animated.View 
            style={[
              styles.decorativeElements,
              { opacity: fadeAnim }
            ]}
          >
            <View style={[styles.floatingCircle, styles.circle1]} />
            <View style={[styles.floatingCircle, styles.circle2]} />
            <View style={[styles.floatingCircle, styles.circle3]} />
          </Animated.View>
        </View>
        
        {/* Elmas Ödül Modalı */}
        <DiamondRewardModal 
          visible={showDiamondModal}
          onClose={() => setShowDiamondModal(false)}
        />
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.1,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    color: '#FFD700',
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 15,
    marginBottom: 10,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 50,
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 60,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonGlow: {
    position: 'absolute',
    width: '120%',
    height: '150%',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    zIndex: -1,
  },
  buttonTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  floatingCircle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 80,
    height: 80,
    top: '15%',
    left: '10%',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  circle2: {
    width: 60,
    height: 60,
    top: '25%',
    right: '15%',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  circle3: {
    width: 100,
    height: 100,
    bottom: '20%',
    left: '5%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
