import { useAuth } from '../../store/AuthProvider';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  // Show a loading spinner while checking for auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If the user is not signed in, redirect to the login page.
  if (!session) {
    return <Redirect href="/login" />;
  }

  // If the user is signed in, render the protected routes.
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
    </Stack>
  );
}
