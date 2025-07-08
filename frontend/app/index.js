import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useRouter } from 'expo-router';

import { useAuth } from '../store/AuthProvider';

const WelcomeScreen = () => {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    // If the session is loaded and exists, redirect to home
    if (!loading && session) {
      router.replace('/home');
    }
  }, [session, loading, router]);

  // Show a loading indicator while session is being checked
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If no session, show the welcome screen
  return (
    <View style={styles.container}>

      <Image
        source={require('../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.subtitle}>Eğlenceye Hazır Mısın?</Text>
      <Button
        title="Başla"
        onPress={() => router.push('/login')}
        buttonStyle={styles.button}
        titleStyle={styles.buttonTitle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  lottie: {
    width: 200,
    height: 200,
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 10, // Sloganla arayı azaltmak için düşürüldü
    resizeMode: 'contain',
  },
  subtitle: {
    fontSize: 18,
    color: 'gray',
    // marginTop: 10, // Logoya yaklaştırmak için kaldırıldı
    marginBottom: 200,
  },
  button: {
    backgroundColor: '#c5363e',
    width: 250,
    height: 50,
    borderRadius: 30,
  },
  buttonTitle: {
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;
