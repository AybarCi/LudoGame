import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../store/AuthProvider';

export default function AuthLayout() {
  const { session } = useAuth();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="lobby" options={{ headerShown: false }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
      <Stack.Screen name="onlineGame" options={{ headerShown: false }} />
    </Stack>
  );
}
