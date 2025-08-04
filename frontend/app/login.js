import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, ImageBackground, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Input, Button, Text } from '@rneui/themed';
import { useAuth } from '../store/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, loading } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert('Giriş Hatası', 'Lütfen e-posta ve şifre alanlarını doldurun.');
      return;
    }
    
    if (!email.includes('@')) {
      Alert.alert('Giriş Hatası', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    
    const { error } = await signIn(email, password);
    if (error) {
      Alert.alert('Giriş Hatası', error.message);
    }
  }

  async function handleSignUp() {
    if (!email || !password || !nickname) {
      Alert.alert('Kayıt Hatası', 'Lütfen tüm alanları doldurun.');
      return;
    }
    
    if (!email.includes('@')) {
      Alert.alert('Kayıt Hatası', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Kayıt Hatası', 'Şifre en az 6 karakter olmalıdır.');
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
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Ionicons name="game-controller" size={60} color="#FFD700" />
              <View style={styles.iconGlow} />
            </View>
            <Text style={styles.title}>
              {isRegistering ? 'Hesap Oluştur' : 'Hoş Geldin!'}
            </Text>
            <Text style={styles.subtitle}>
              {isRegistering ? 'Ludo Turco ailesine katıl' : 'Oyuna devam etmek için giriş yap'}
            </Text>
          </View>

          <View style={styles.inputsContainer}>
            <View style={styles.inputWrapper}>
              <Input
                placeholder='E-posta adresin'
                leftIcon={{ type: 'ionicon', name: 'mail-outline', color: '#FFD700', size: 20 }}
                onChangeText={setEmail}
                value={email}
                inputContainerStyle={styles.inputContainer}
                inputStyle={styles.inputText}
                placeholderTextColor="rgba(255,255,255,0.7)"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Input
                placeholder='Şifren'
                leftIcon={{ type: 'ionicon', name: 'lock-closed-outline', color: '#FFD700', size: 20 }}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                }
                onChangeText={setPassword}
                value={password}
                secureTextEntry={!showPassword}
                inputContainerStyle={styles.inputContainer}
                inputStyle={styles.inputText}
                placeholderTextColor="rgba(255,255,255,0.7)"
                autoCapitalize="none"
              />
            </View>

            {isRegistering && (
              <Animated.View style={styles.inputWrapper}>
                <Input
                  placeholder='Rumuzun (oyunda görünecek isim)'
                  leftIcon={{ type: 'ionicon', name: 'person-outline', color: '#FFD700', size: 20 }}
                  onChangeText={setNickname}
                  value={nickname}
                  inputContainerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  autoCapitalize="none"
                />
              </Animated.View>
            )}
          </View>

          <View style={styles.buttonsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>
                  {isRegistering ? 'Hesap oluşturuluyor...' : 'Giriş yapılıyor...'}
                </Text>
              </View>
            ) : (
              <>
                <Button 
                  title={isRegistering ? '🎮 Hesap Oluştur' : '🎮 Oyuna Başla'}
                  buttonStyle={styles.primaryButton}
                  titleStyle={styles.primaryButtonText}
                  onPress={isRegistering ? handleSignUp : handleSignIn}
                />
                
                <TouchableOpacity 
                  style={styles.switchButton}
                  onPress={() => setIsRegistering(!isRegistering)}
                >
                  <Text style={styles.switchText}>
                    {isRegistering ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
                    <Text style={styles.switchTextBold}>
                      {isRegistering ? 'Giriş Yap' : 'Hesap Oluştur'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    color: '#FFD700',
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputsContainer: {
    marginBottom: 25,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    borderBottomWidth: 0,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  inputText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  buttonsContainer: {
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  switchButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  switchText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  switchTextBold: {
    color: '#FFD700',
    fontFamily: 'Poppins_600SemiBold',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
