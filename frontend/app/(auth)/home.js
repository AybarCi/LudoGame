import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Alert, ActivityIndicator, ImageBackground, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import HomeButtons from '../../components/modules/HomeButtons';
import RotatingStatsCard from '../../components/modules/RotatingStatsCard';
import { DiamondService } from '../../services/DiamondService';
import { EnergyService } from '../../services/EnergyService';


const { width, height } = Dimensions.get('window');


const HomeScreen = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [diamonds, setDiamonds] = useState(0);
  const [energy, setEnergy] = useState({ current: 0, max: 5, timeUntilNext: null });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  useEffect(() => {
    // Enerji sistemini başlat
    EnergyService.initializeEnergySystem().then(() => {
      loadDiamonds();
      loadEnergy();
    });
    
    // Set up energy refresh interval
    const energyInterval = setInterval(() => {
      loadEnergy();
    }, 60000); // Update every minute
    
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

    // Cleanup interval on unmount
    return () => {
      clearInterval(energyInterval);
    };
  }, []);



  const loadDiamonds = async () => {
    const currentDiamonds = await DiamondService.getDiamonds();
    setDiamonds(currentDiamonds);
  };

  const loadEnergy = async () => {
    try {
      const energyInfo = await EnergyService.getEnergyInfo();
      setEnergy({
        current: energyInfo.current,
        max: energyInfo.max,
        timeUntilNext: energyInfo.timeUntilNext
      });
    } catch (error) {
      console.error('Error loading energy:', error);
    }
  };

  const handlePlayWithAI = async () => {
    // Check energy before starting game
    const hasEnergy = await EnergyService.hasEnoughEnergy();
    if (!hasEnergy) {
      router.push('/(auth)/energy');
      return;
    }

    // Use energy
    await EnergyService.useEnergy();

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
    router.push('/(auth)/lobby');
  };

  const handleShop = () => {
    router.push('/(auth)/shop');
  };

  const handleFreeMode = () => {
    router.push('/(auth)/freemode');
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
            <RotatingStatsCard
              stats={[
                {
                  icon: 'flash',
                  iconColor: '#FFD700',
                  value: `${energy.current}/${energy.max}`,
                  label: 'Enerji',
                  gradient: ['#FFD700', '#FFA000'],
                  valueColor: '#FFFFFF',
                  onPress: () => router.push('/(auth)/energy')
                },
                {
                  icon: 'diamond',
                  iconColor: '#9C27B0',
                  value: diamonds,
                  label: 'Elmas',
                  gradient: ['#9C27B0', '#BA68C8'],
                  valueColor: '#FFFFFF'
                },
                {
                  icon: 'trophy',
                  iconColor: '#FF6B35',
                  value: user?.score || 0,
                  label: 'Puan',
                  gradient: ['#FF6B35', '#FF8A65'],
                  valueColor: '#FFFFFF'
                },
                {
                  icon: 'trending-up',
                  iconColor: '#4CAF50',
                  value: Math.floor((user?.score || 0) / 100) + 1,
                  label: 'Seviye',
                  gradient: ['#4CAF50', '#66BB6A'],
                  valueColor: '#FFFFFF'
                }
              ]}
            />
          </View>
        </Animated.View>

        {/* Logout Icon - Top Left */}
        <TouchableOpacity 
          style={styles.logoutIcon}
          onPress={signOut}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF5722', '#FF7043']}
            style={styles.logoutIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
               <ActivityIndicator size={24} color="white" />
             ) : (
               <Ionicons name="log-out" size={24} color="white" />
             )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Market Icon - Top Right */}
        <TouchableOpacity 
          style={styles.marketIcon}
          onPress={handleShop}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#9C27B0', '#BA68C8']}
            style={styles.marketIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="storefront" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomContainer}>
          <Animated.View 
            style={[
              styles.modeSelectionContainer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.modeTitle}>Oyun Modu Seç</Text>
            
            <HomeButtons 
              fadeAnim={fadeAnim}
              buttonAnims={buttonAnims}
              handlePlayWithAI={handlePlayWithAI}
              handlePlayOnline={handlePlayOnline}
              handleFreeMode={handleFreeMode}
              handleShop={handleShop}
              signOut={signOut}
              loading={loading}
              showShopButton={false}
            />
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
    paddingVertical: height * 0.03,
    paddingHorizontal: 20,
  },
  topContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
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
    width: '100%',
    paddingHorizontal: 15,
    height: 140,
    justifyContent: 'center',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
    paddingTop: 100,
  },
  modeSelectionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  logoutIcon: {
    position: 'absolute',
    top: 80,
    left: 20,
    zIndex: 10,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  logoutIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketIcon: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 10,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  marketIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
 
});

export default HomeScreen;