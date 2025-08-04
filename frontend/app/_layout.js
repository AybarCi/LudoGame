import { AuthProvider, useAuth } from '../store/AuthProvider';
import { SocketProvider, useSocket } from '../store/SocketProvider';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useEffect } from 'react';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { session, loading, user } = useAuth();
  const { connect } = useSocket();
  const router = useRouter();
  const segments = useSegments();

  // Socket bağlantısını otomatik olarak başlat
  useEffect(() => {
    if (user && connect) {
      connect(user);
    }
  }, [user, connect]);

  useEffect(() => {
    if (fontError) throw fontError;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!fontsLoaded || loading) return;

    // Add a small delay to ensure the layout is fully mounted
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
  }, [session, loading, fontsLoaded, segments, router]);

  if (!fontsLoaded || loading) {
    return (
      <ImageBackground 
        source={require('../assets/images/wood-background.png')} 
        style={styles.loadingContainer}
        resizeMode="cover"
      >
        <ActivityIndicator size="large" color="#ffffff" />
      </ImageBackground>
    );
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
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

