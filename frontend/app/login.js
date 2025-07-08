import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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
    <View style={styles.container}>
      <Text h4 style={styles.title}>Giriş Yap veya Kayıt Ol</Text>
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
        buttonStyle={styles.button}
        type="outline"
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
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 30,
  },
  inputContainer: {
    width: '90%',
    marginBottom: 15,
  },
  button: {
    width: 250,
    borderRadius: 10,
  },
});

export default LoginScreen;
