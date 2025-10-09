import { Redirect, Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { useState, useEffect, useMemo, useRef } from 'react';

export default function AuthLayout() {
  // Component mount durumunu takip et
  const isMountedRef = useRef(true);
  
  // TÜM hook'ları en başta çağır - React hooks kuralları KESİNLİKLE zorunlu
  const authState = useSelector(state => state?.auth || { token: null, user: null, isAuthenticated: false });
  const { token, user, isAuthenticated: reduxIsAuthenticated } = authState;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Component mount/unmount durumunu takip et
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // useEffect HER ZAMAN çağrılır - conditional değil
  useEffect(() => {
    if (isMountedRef.current) {
      const shouldBeAuthenticated = reduxIsAuthenticated !== undefined ? reduxIsAuthenticated : !!token;
      setIsAuthenticated(shouldBeAuthenticated);
    }
  }, [token, reduxIsAuthenticated]);

  // Auth durumunu memoize et - bu hook'ların sırasını sabitler
  const authCheck = useMemo(() => {
    return isAuthenticated;
  }, [isAuthenticated]);

  // Koşullu render yerine koşullu içerik kullan - React Hooks kurallarına uygun
  if (!authCheck) {
    console.log('AuthLayout: No token found, redirecting to login');
    return <Redirect href="/login" />;
  }

  console.log('AuthLayout: User authenticated, rendering auth layout');

  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="lobby" options={{ headerShown: false }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
      <Stack.Screen name="onlineGame" options={{ headerShown: false }} />
      <Stack.Screen name="freemode" options={{ headerShown: false }} />
      <Stack.Screen name="freemodegame" options={{ headerShown: false }} />
      <Stack.Screen name="shop" options={{ headerShown: false }} />
      <Stack.Screen name="earndiamonds" options={{ headerShown: false }} />
      <Stack.Screen name="energy" options={{ headerShown: false }} />
      <Stack.Screen name="diamonds" options={{ headerShown: false }} />
    </Stack>
  );
}
