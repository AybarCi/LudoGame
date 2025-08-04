import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { Input, Button, Text } from '@rneui/themed';
import { useAuth } from '../store/AuthProvider';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { signIn, signUp, loading } = useAuth();

  async function handleSignIn() {
    const { error } = await signIn(email, password);
    if (error) {
      Alert.alert('Giriş Hatası', error.message);
    }
  }

  async function handleSignUp() {
    if (!nickname) {
      Alert.alert('Kayıt Hatası', 'Lütfen bir rumuz girin.');
      return;
    }
    const { error } = await signUp(email, password, nickname);
    if (error) {
      Alert.alert('Kayıt Hatası', error.message);
    } else {
      Alert.alert('Başarılı', 'Kayıt başarılı! Lütfen giriş yapın.');
      setIsRegistering(false);
    }
  }

  return (
    <ImageBackground 
      source={require('../assets/images/wood-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text h2 style={styles.title}>
          {isRegistering ? 'Kayıt Ol' : 'Ludo Turco'}
        </Text>

        <Input
          placeholder='E-posta'
          leftIcon={{ type: 'font-awesome', name: 'envelope', color: 'white' }}
          onChangeText={setEmail}
          value={email}
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.inputText}
          placeholderTextColor="#ccc"
          autoCapitalize="none"
        />

        <Input
          placeholder='Şifre'
          leftIcon={{ type: 'font-awesome', name: 'lock', color: 'white' }}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.inputText}
          placeholderTextColor="#ccc"
          autoCapitalize="none"
        />

        {isRegistering && (
          <Input
            placeholder='Rumuz'
            leftIcon={{ type: 'font-awesome', name: 'user', color: 'white' }}
            onChangeText={setNickname}
            value={nickname}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.inputText}
            placeholderTextColor="#ccc"
            autoCapitalize="none"
          />
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <Button 
              title={isRegistering ? 'Kayıt Ol' : 'Giriş Yap'}
              buttonStyle={styles.button}
              onPress={isRegistering ? handleSignUp : handleSignIn}
            />
            <Button 
              title={isRegistering ? 'Zaten hesabın var mı? Giriş Yap' : 'Hesap Oluştur'}
              type="clear"
              titleStyle={styles.switchText}
              onPress={() => setIsRegistering(!isRegistering)}
            />
          </>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: 'white',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    borderBottomWidth: 0,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputText: {
    color: 'white',
  },
  button: {
    backgroundColor: '#ff4d4d',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: 250,
    elevation: 3,
  },
  switchText: {
    color: '#fff',
    marginTop: 15,
  },
});

export default LoginScreen;
