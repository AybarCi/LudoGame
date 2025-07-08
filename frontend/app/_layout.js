import { AuthProvider } from '../store/AuthProvider';
import { SocketProvider } from '../store/SocketProvider';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Stack>
          {/* Publicly accessible screens */}
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Protected screens, grouped under (auth) */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </SocketProvider>
    </AuthProvider>
  );
}

