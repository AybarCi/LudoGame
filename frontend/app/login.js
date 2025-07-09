import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { Input, Button, Text } from '@rneui/themed';
import { useAuth } from '../store/AuthProvider'; // Import useAuth

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { signIn, signUp, loading } = useAuth(); // Use global state and functions

  async function handleSignIn() {
    const { error } = await signIn(email, password);
    if (error) {
      Alert.alert('Giriş Hatası', error.message);
    }
    // On success, the AuthProvider's onAuthStateChange will trigger the redirect.
  }

  async function handleSignUp() {
    if (!username) {
      Alert.alert('Kayıt Hatası', 'Lütfen bir rumuz girin.');
      return;
    }
    const { error } = await signUp(email, password, username);
    if (error) {
      Alert.alert('Kayıt Hatası', error.message);
    }
    // On success, a confirmation email is sent, and the user can now sign in.
  }

  return (
    <ImageBackground 
      source={require('../assets/images/wood-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <Text h4 style={styles.title}>Giriş Yap veya Kayıt Ol</Text>
      <View style={styles.formContainer}>
        <Input
          label="Email"
          placeholder="email@adres.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize={'none'}
          containerStyle={styles.inputContainer}
        />
        <Input
          label="Şifre"
          placeholder="Şifreniz"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          containerStyle={styles.inputContainer}
        />
        <Input
          label="Rumuz (Sadece kayıt olurken)"
          placeholder="Oyuncu123"
          value={username}
          onChangeText={setUsername}
          autoCapitalize={'none'}
          containerStyle={styles.inputContainer}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          onPress={handleSignIn}
          disabled={loading}
          buttonStyle={[styles.button, { marginBottom: 10 }]}
          icon={loading && <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />}
        />
        <Button
          title={loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
          onPress={handleSignUp}
          disabled={loading}
          buttonStyle={[styles.button, styles.secondaryButton]}
          titleStyle={styles.secondaryButtonTitle}
          icon={loading && <ActivityIndicator style={{ marginRight: 10 }} />}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    marginBottom: 20,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  button: {
    width: 250,
    borderRadius: 10,
    backgroundColor: '#c5363e',
  },
  buttonContainer: {
    marginTop: 40,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 2,
  },
  secondaryButtonTitle: {
    fontWeight: 'bold',
    color: '#fff'
  },
});

export default LoginScreen;
