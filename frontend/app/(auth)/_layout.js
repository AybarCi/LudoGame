import { Redirect, Stack } from 'expo-router';
import { useSelector } from 'react-redux';
import { useState, useEffect, useMemo, useRef } from 'react';

export default function AuthLayout() {
  // Redux store'dan auth durumunu doğrudan al - local state gerekmez
  const authState = useSelector(state => state?.auth || { token: null, user: null, isAuthenticated: false });
  const { token, isAuthenticated } = authState;
  
  // Auth durumunu memoize et - gereksiz re-render'ları önle
  const authCheck = useMemo(() => {
    // Redux'ta isAuthenticated undefined olabilir, bu durumda token kontrolü yap
    return isAuthenticated !== undefined ? isAuthenticated : !!token;
  }, [isAuthenticated, token]);

  // Debug için sadece auth durumu değiştiğinde log yaz
  useEffect(() => {
    console.log('AuthLayout: Auth state changed:', {
      isAuthenticated,
      hasToken: !!token,
      authCheck,
      timestamp: Date.now()
    });
    
    if (authCheck) {
      console.log('AuthLayout: User authenticated, rendering auth layout');
    } else {
      console.log('AuthLayout: No token found, redirecting to login');
    }
  }, [authCheck, isAuthenticated, token]);

  // Koşullu render
  if (!authCheck) {
    console.log('AuthLayout: Redirecting to login...');
    return <Redirect href="/login" />;
  }

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
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}
