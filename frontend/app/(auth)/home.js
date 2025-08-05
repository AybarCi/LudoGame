import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet, Alert, ActivityIndicator, ImageBackground, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import HomeButtons from '../../components/modules/HomeButtons';

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

  const handleShop = () => {
    router.push('/shop');
  };

  const handleFreeMode = () => {
    router.push('/freemode');
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