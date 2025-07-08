import React, { useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/AuthProvider';

const HomeScreen = () => {
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handlePlayWithAI = () => {
    router.push({ pathname: '/game', params: { mode: 'ai' } });
  };

  const handlePlayOnline = () => {
    router.push({ pathname: '/game', params: { mode: 'online' } });
  };

  if (loading || !user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text h4 style={styles.welcomeText}>Hoş Geldin, {user?.user_metadata?.username || user?.email}!</Text>
      <Text style={styles.infoText}>Hangi modda oynamak istersin?</Text>
      <Button
        title="🤖 Yapay Zekaya Karşı Oyna"
        onPress={handlePlayWithAI}
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
      />
      <Button
        title="🌐 Online Oyna"
        onPress={handlePlayOnline}
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
      />
      <Button
        title={loading ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
        onPress={signOut}
        buttonStyle={styles.button}
        containerStyle={styles.buttonContainer}
        type="outline"
        disabled={loading}
        icon={loading && <ActivityIndicator style={{ marginRight: 10 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  welcomeText: {
    marginBottom: 10,
  },
  infoText: {
    marginBottom: 30,
    fontSize: 16,
    color: 'gray',
  },
  buttonContainer: {
    width: '80%',
    marginVertical: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 15,
  },
});

export default HomeScreen;