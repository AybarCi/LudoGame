import { AuthProvider, useAuth } from '../store/AuthProvider';
import { SocketProvider, useSocket } from '../store/SocketProvider';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useEffect } from 'react';

// Development mode - skip heavy loading
const __DEV__ = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// Prevent the splash screen from auto-hiding before asset loading is complete.
if (!__DEV__) {
  SplashScreen.preventAutoHideAsync();
}

function InitialLayout() {
  const { session, loading, user } = useAuth();
  const { connect } = useSocket();
  const router = useRouter();
  const segments = useSegments();

  // Socket bağlantısını otomatik olarak başlat (development'ta hızlı bağlan)
  useEffect(() => {
    if (user && connect && !__DEV__) {
      connect(user);
    }
  }, [user, connect]);

  useEffect(() => {
    if (__DEV__) {
      // Development modda hızlı geçiş
      const timer = setTimeout(() => {
        router.replace('/login-dev');
      }, 500);
      return () => clearTimeout(timer);
    }

    if (!loading) {
      const timer = setTimeout(() => {
        const inAuthGroup = segments[0] === '(auth)';

        if (session && !inAuthGroup) {
          router.replace('/(auth)/home');
        } else if (!session && inAuthGroup) {
          router.replace('/login');
        } else if (!session && !inAuthGroup) {
          if (segments[0] !== 'login') {
            router.replace('/login');
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [session, loading, segments, router]);

  if (loading && !__DEV__) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (__DEV__) {
    return (
      <View style={styles.devContainer}>
        <Text style={styles.devText}>DEV MODE</Text>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ animation: 'fade', headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="login-dev" />
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  devContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  devText: {
    color: '#e94560',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

function RootLayoutNav() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <SocketProvider>
      <RootLayoutNav />
    </SocketProvider>
  );
}