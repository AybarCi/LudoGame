import React from 'react';
import { AuthProvider, useAuth } from '../store/AuthProvider';
import ReduxAuthProvider from '../store/ReduxAuthProvider';
import { SocketProvider, useSocket } from '../store/SocketProvider';
import { Provider, useSelector } from 'react-redux';
import { store } from '../store';
import { AuthListener } from '../store/AuthListener';
import SimpleAlertListener from '../components/shared/SimpleAlertListener';
import { Stack } from 'expo-router';
import { ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useEffect, useState } from 'react';
import { AdService } from '../services/AdService';
import CustomSplashScreen from '../components/SplashScreen';


// Custom splash screen kullanıyoruz, expo splash screen'i devre dışı bırak

const InitialLayout = React.memo(function InitialLayout() {
  // TÜM hook'ları en başta çağır - React hooks kuralları KESİNLİKLE zorunlu
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [isReady, setIsReady] = useState(false);

  const authState = useSelector(state => state?.auth || { isLoading: false, user: null });
  const loading = authState.isLoading;
  const user = authState.user;
  
  // useSocket hook'unu güvenli şekilde kullan
  const socketContext = useSocket();
  const connect = socketContext?.connect;

  // Socket bağlantısını otomatik olarak başlat - HER ZAMAN çağrılır
  useEffect(() => {
    if (user && connect && typeof connect === 'function') {
      // Extract actual user object if it's wrapped in success property
      const actualUser = user.success && user.user ? user.user : user;
      try {
        connect(actualUser);
      } catch (error) {
        console.error('[InitialLayout] Socket bağlantısı başlatılamadı:', error);
      }
    }
  }, [user, connect]);

  // Font ve hazırlık effect'i - HER ZAMAN çağrılır
  useEffect(() => {
    if (fontError) throw fontError;

    if (fontsLoaded) {
      // Fontlar yüklendiğinde hazır durumuna geç
      setIsReady(true);
      // AdService'i initialize et
      AdService.initialize();
    }
  }, [fontsLoaded, fontError]);

  // Conditional return SADECE tüm hook'lar çağrıldıktan sonra
  if (!fontsLoaded || !isReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ animation: 'fade', headerShown: false }}>
      {/* Publicly accessible screens */}
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />

      {/* Protected screens, grouped under (auth) */}
      <Stack.Screen name="(auth)" />
    </Stack>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});

const AppContent = React.memo(function AppContent() {
  return (
    <SocketProvider>
      <AuthListener>
        <InitialLayout />
        <SimpleAlertListener />
      </AuthListener>
    </SocketProvider>
  );
});

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ReduxAuthProvider>
        <AppContent />
      </ReduxAuthProvider>
    </Provider>
  );
}

