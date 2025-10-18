import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { initializeAuth } from '../store/slices/authSlice';
import { store } from '../store';
import LaunchDiagnostics from '../utils/launchDiagnostics';

const { width, height } = Dimensions.get('window');

const CustomSplashScreen = () => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const router = useRouter();
  const dispatch = useDispatch();
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [error, setError] = useState(null);
  
  const logoImage = require('../assets/images/logo.png');

  useEffect(() => {
    console.log('SplashScreen: Component mounting...');
    LaunchDiagnostics.logStage('SPLASH_MOUNT_START');
    
    // Kritik kaynak kontrolleri
    try {
      const resourceChecks = LaunchDiagnostics.checkCriticalResources();
      console.log('SplashScreen: Resource checks:', resourceChecks);
      LaunchDiagnostics.logStage('RESOURCE_CHECKS', resourceChecks);
      
      const failedChecks = resourceChecks.filter(check => check.status === 'error');
      if (failedChecks.length > 0) {
        console.error('SplashScreen: Critical resources failed:', failedChecks);
        LaunchDiagnostics.logStage('CRITICAL_RESOURCES_FAILED', failedChecks);
      }
    } catch (error) {
      console.error('SplashScreen: Resource check failed:', error);
      LaunchDiagnostics.logStage('RESOURCE_CHECK_ERROR', { error: error.message });
    }

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
    ]).start(() => {
      LaunchDiagnostics.logStage('ANIMATION_COMPLETE');
    });

    // Auth kontrolünü başlat (kısa gecikmeyle)
    setTimeout(() => {
      LaunchDiagnostics.logStage('AUTH_CHECK_START');
      try {
        checkAuthAndRedirect();
      } catch (error) {
        console.error('SplashScreen: Critical error in checkAuthAndRedirect:', error);
        setError(error);
        LaunchDiagnostics.logStage('AUTH_CHECK_CRASH', { 
          error: error.message,
          stack: error.stack 
        });
        // Crash durumunda güvenli yönlendirme
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    }, 500);
    
    return () => {
      LaunchDiagnostics.logStage('SPLASH_UNMOUNT');
    };
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      console.log('SplashScreen: Starting auth check...');
      LaunchDiagnostics.logStage('AUTH_CHECK_METHOD_START');
      
      // InitializeAuth thunk'unu çalıştır - bu zaten token kontrolü yapıyor
      console.log('SplashScreen: Calling initializeAuth...');
      
      if (!dispatch || typeof dispatch !== 'function') {
        throw new Error('Dispatch function is not available');
      }
      
      let result;
      try {
        result = await dispatch(initializeAuth());
      } catch (authInitError) {
        console.error('SplashScreen: initializeAuth call failed:', authInitError);
        LaunchDiagnostics.logStage('AUTH_INIT_FAILED', { 
          error: authInitError.message,
          stack: authInitError.stack 
        });
        // initializeAuth failed but continue
        result = { payload: null };
      }
      
      console.log('SplashScreen: initializeAuth result:', result?.payload || result);
      LaunchDiagnostics.logStage('AUTH_INIT_COMPLETE', { 
        success: result?.meta?.requestStatus === 'fulfilled',
        payload: result?.payload 
      });
      
      // Kısa bir bekleme süresi
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redux state'ini kontrol et
      let currentState;
      try {
        currentState = store.getState();
      } catch (storeError) {
        console.error('SplashScreen: Store access failed:', storeError);
        LaunchDiagnostics.logStage('STORE_ACCESS_ERROR', { error: storeError.message });
        throw new Error('Failed to access Redux store');
      }
      
      console.log('SplashScreen: Final auth state:', {
        isLoading: currentState.auth?.isLoading,
        isAuthenticated: currentState.auth?.isAuthenticated,
        hasToken: !!currentState.auth?.token,
        hasUser: !!currentState.auth?.user
      });
      
      LaunchDiagnostics.logStage('AUTH_STATE_CHECK', {
        isLoading: currentState.auth?.isLoading,
        isAuthenticated: currentState.auth?.isAuthenticated,
        hasToken: !!currentState.auth?.token,
        hasUser: !!currentState.auth?.user
      });
      
      // Basit mantık: initializeAuth zaten token kontrolü yaptı
      if (currentState.auth?.isAuthenticated && currentState.auth?.token) {
        console.log('SplashScreen: Authentication successful, redirecting to home');
        LaunchDiagnostics.logStage('AUTH_SUCCESS_REDIRECT');
        setTimeout(() => {
          router.replace('/home');
        }, 1500);
      } else {
        console.log('SplashScreen: Authentication failed, redirecting to login');
        LaunchDiagnostics.logStage('AUTH_FAILED_REDIRECT');
        setTimeout(() => {
          router.replace('/login');
        }, 1500);
      }
      
    } catch (error) {
      console.error('SplashScreen: Auth check failed:', error);
      LaunchDiagnostics.logStage('AUTH_CHECK_ERROR', { 
        error: error.message,
        stack: error.stack 
      });
      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    }
  };

  // Redux state değişikliklerini izlemeye gerek yok, checkAuthAndRedirect tüm mantığı yönetiyor

  // Error durumunda basit fallback
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Animated.View 
          style={[
            styles.logoContainer, 
            { 
              opacity: fadeAnim, 
              transform: [{ scale: scaleAnim }] 
            }
          ]}
        >
          <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>
        <Animated.Text style={[styles.errorText, { opacity: fadeAnim }]}>
          Uygulama başlatılırken hata oluştu. Yeniden yönlendiriliyorsunuz...
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
      </Animated.View>
    </View>
  );
};

const CustomSplashScreenWrapper = () => (
  // Provider zaten _layout.js'de var, tekrar Provider kullanma!
  <CustomSplashScreen />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6E00B3',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    opacity: 0.8,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  logoImage: {
    width: 250,
    height: 250,
  },
});

export default CustomSplashScreenWrapper;