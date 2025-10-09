import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth } from '../store/slices/authSlice';
import { store } from '../store';

const { width, height } = Dimensions.get('window');

const CustomSplashScreen = () => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const router = useRouter();
  const dispatch = useDispatch();
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const logoImage = require('../assets/images/logo.png');

  useEffect(() => {
    // Logo animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Auth kontrolünü başlat (kısa gecikmeyle)
    setTimeout(() => {
      checkAuthAndRedirect();
    }, 500);
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      console.log('SplashScreen: Starting auth check...');
      
      // InitializeAuth thunk'unu çalıştır - bu zaten token kontrolü yapıyor
      console.log('SplashScreen: Calling initializeAuth...');
      const result = await dispatch(initializeAuth());
      
      console.log('SplashScreen: initializeAuth result:', result);
      
      // Kısa bir bekleme süresi
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redux state'ini kontrol et
      const currentState = store.getState();
      console.log('SplashScreen: Final auth state:', {
        isLoading: currentState.auth.isLoading,
        isAuthenticated: currentState.auth.isAuthenticated,
        hasToken: !!currentState.auth.token,
        hasUser: !!currentState.auth.user
      });
      
      // Basit mantık: initializeAuth zaten token kontrolü yaptı
      if (currentState.auth.isAuthenticated && currentState.auth.token) {
        console.log('SplashScreen: Authentication successful, redirecting to /(auth)/home');
        setTimeout(() => {
          router.replace('/home');
        }, 1500);
      } else {
        console.log('SplashScreen: Authentication failed, redirecting to login');
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      }
      
    } catch (error) {
      console.error('SplashScreen: Auth check failed:', error);
      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    }
  };

  // Redux state değişikliklerini izlemeye gerek yok, checkAuthAndRedirect tüm mantığı yönetiyor

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6E00B3', '#E61A8D', '#00D9CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
        <View style={styles.centerContainer}>
          {/* Logo - Tam Ortada */}
          <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
          >
            <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6E00B3',
  },
  backgroundGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 300,
    height: 300,
  },
});

export default CustomSplashScreen;