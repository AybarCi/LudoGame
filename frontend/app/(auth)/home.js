import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Alert, ActivityIndicator, ImageBackground, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');


const HomeScreen = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered button animations
    buttonAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 200 + (index * 150),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handlePlayWithAI = () => {
    const playerNickname = user?.nickname || 'Oyuncu 1';
    const playersInfo = {
      red: { nickname: playerNickname, type: 'human' },
      green: { nickname: 'Cansu', type: 'ai' },
      yellow: { nickname: 'Cenk Acar', type: 'ai' },
      blue: { nickname: 'Cihan', type: 'ai' },
    };

    router.push({
      pathname: '/game',
      params: {
        mode: 'ai',
        playersInfo: JSON.stringify(playersInfo),
        playerColor: 'red',
      },
    });
  };

  const handlePlayOnline = () => {
    router.push('/lobby');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../../assets/images/wood-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.topContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.headerContainer}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={40} color="#FFD700" />
              </View>
              <View style={styles.avatarGlow} />
            </View>
            <Text style={styles.welcomeText}>Hoş Geldin!</Text>
            <Text style={styles.nicknameText}>{user?.nickname || 'Misafir'}</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{user?.score || 0}</Text>
              <Text style={styles.statLabel}>Puan</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{Math.floor((user?.score || 0) / 100) + 1}</Text>
              <Text style={styles.statLabel}>Seviye</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.bottomContainer}>
          <Animated.View 
            style={[
              styles.modeSelectionContainer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.modeTitle}>Oyun Modu Seç</Text>
            
            <Animated.View 
              style={[
                styles.gameButtonContainer,
                {
                  opacity: buttonAnims[0],
                  transform: [{
                    translateY: buttonAnims[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity style={styles.gameButton} onPress={handlePlayWithAI}>
                <LinearGradient
                  colors={['#FF6B35', '#FF8E53']}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="hardware-chip" size={28} color="white" />
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>Yapay Zeka</Text>
                      <Text style={styles.buttonSubtitle}>Bilgisayara karşı oyna</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View 
              style={[
                styles.gameButtonContainer,
                {
                  opacity: buttonAnims[1],
                  transform: [{
                    translateY: buttonAnims[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity style={styles.gameButton} onPress={handlePlayOnline}>
                <LinearGradient
                  colors={['#4CAF50', '#66BB6A']}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="globe" size={28} color="white" />
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>Online Oyun</Text>
                      <Text style={styles.buttonSubtitle}>Gerçek oyunculara karşı</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View 
              style={[
                styles.gameButtonContainer,
                {
                  opacity: buttonAnims[2],
                  transform: [{
                    translateY: buttonAnims[2].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity 
                style={[styles.gameButton, styles.logoutButton]} 
                onPress={signOut}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  {loading ? (
                    <ActivityIndicator size={28} color="rgba(255,255,255,0.8)" />
                  ) : (
                    <Ionicons name="log-out" size={28} color="rgba(255,255,255,0.8)" />
                  )}
                  <View style={styles.buttonTextContainer}>
                    <Text style={[styles.buttonTitle, styles.logoutButtonTitle]}>
                      {loading ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
                    </Text>
                    <Text style={[styles.buttonSubtitle, styles.logoutButtonSubtitle]}>Hesaptan çık</Text>
                  </View>
                  {!loading && <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingVertical: height * 0.05,
    paddingHorizontal: 20,
  },
  topContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    zIndex: 2,
  },
  avatarGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 24,
    color: '#FFD700',
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 5,
  },
  nicknameText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Poppins_400Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statValue: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  modeSelectionContainer: {
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
  },
  gameButtonContainer: {
    width: '100%',
    marginBottom: 15,
  },
  gameButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  buttonTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Poppins_400Regular',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  logoutButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default HomeScreen;