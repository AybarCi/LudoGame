import React from 'react';
import { View, StyleSheet, Image, ImageBackground } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { useRouter } from 'expo-router';

export default function Welcome() {
  const router = useRouter();

  return (
    <ImageBackground source={require('../assets/images/wood-background.png')} style={styles.background}>
      <View style={styles.container}>
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.subtitle}>Oyunun Ustası Ol</Text>
        <Button
          title="Giriş Yap / Kayıt Ol"
          buttonStyle={styles.button}
          titleStyle={styles.buttonTitle}
          onPress={() => router.replace('/login')}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#C84343',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 50,
  },
  buttonTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
});
