import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Animated,
  Dimensions,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Text } from '@rneui/themed';
import { useAuth } from '../store/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomAlertModal from '../components/shared/CustomAlertModal';

const { width, height } = Dimensions.get('window');

const ModernLoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [timer, setTimer] = useState(0);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });
  const { signIn, signUp, loading, sendPhoneVerificationCode, signUpWithPhone, signInWithPhone } = useAuth();
  
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

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneNumberChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const validatePhoneNumber = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      showAlert('Hata', 'Lütfen geçerli bir telefon numarası girin. (10 haneli)');
      return false;
    }
    return true;
  };

  const handleSendCode = async () => {
    if (!validatePhoneNumber()) return;
    
    const { error } = await sendPhoneVerificationCode(phoneNumber);
    if (error) {
      showAlert('Hata', error.message);
      return;
    }
    
    setVerificationStep(true);
    setTimer(60); // 60 second timer
    showAlert('Doğrulama Kodu Gönderildi', 'Telefonunuza doğrulama kodu gönderildi. (Demo: Kod konsolda)', 'success');
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showAlert('Hata', 'Lütfen 6 haneli doğrulama kodunu girin.');
      return;
    }

    if (isRegistering) {
      if (!nickname.trim()) {
        showAlert('Hata', 'Lütfen bir rumuz girin.');
        return;
      }
      // Register user with phone
      const { error } = await signUpWithPhone(phoneNumber, verificationCode, nickname);
      if (error) {
        showAlert('Kayıt Hatası', error.message);
      } else {
        showAlert('Başarılı', 'Kayıt başarılı! Giriş yapıldı.', 'success');
      }
    } else {
      // Login user with phone
      const { error } = await signInWithPhone(phoneNumber, verificationCode);
      if (error) {
        showAlert('Giriş Hatası', error.message);
      }
    }
  };

  const handleResendCode = () => {
    if (timer === 0) {
      handleSendCode();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPhoneStep = () => (
    <>
      <View style={styles.phoneInputContainer}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>🇹🇷 +90</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder="Telefon Numaran"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={phoneNumber}
          onChangeText={handlePhoneNumberChange}
          keyboardType="phone-pad"
          maxLength={14}
          autoFocus
        />
      </View>

      {isRegistering && (
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#FFD700" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Rumuzun (oyunda görünecek isim)"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
          />
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={handleSendCode}>
        <Text style={styles.primaryButtonText}>
          {isRegistering ? '📱 Doğrulama Kodu Gönder' : '📱 Giriş Kodu Gönder'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchButton} onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.switchText}>
          {isRegistering ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
          <Text style={styles.switchTextBold}>
            {isRegistering ? 'Giriş Yap' : 'Hesap Oluştur'}
          </Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderVerificationStep = () => (
    <>
      <View style={styles.verificationContainer}>
        <Text style={styles.verificationTitle}>Doğrulama Kodu</Text>
        <Text style={styles.verificationSubtitle}>
          +90 {phoneNumber} numarasına gönderilen 6 haneli kodu girin
        </Text>

        <View style={styles.codeInputContainer}>
          <TextInput
            style={styles.codeInput}
            placeholder="------"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        {timer > 0 ? (
          <Text style={styles.timerText}>Kalan süre: {formatTime(timer)}</Text>
        ) : (
          <TouchableOpacity onPress={handleResendCode}>
            <Text style={styles.resendText}>Kodu tekrar gönder</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyCode}>
          <Text style={styles.primaryButtonText}>✅ Doğrula ve Giriş Yap</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => setVerificationStep(false)}>
          <Text style={styles.backButtonText}>← Numarayı değiştir</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <ImageBackground 
      source={require('../assets/images/wood-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
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
                  <Ionicons name="phone-portrait-outline" size={60} color="#FFD700" />
                  <View style={styles.iconGlow} />
                </View>
                <Text style={styles.title}>
                  {verificationStep ? 'Doğrulama' : (isRegistering ? 'Hesap Oluştur' : 'Hoş Geldin!')}
                </Text>
                <Text style={styles.subtitle}>
                  {verificationStep 
                    ? 'Telefonuna gelen kodu gir' 
                    : (isRegistering 
                        ? 'Telefon numaran ile kayıt ol' 
                        : 'Telefon numaran ile giriş yap')
                  }
                </Text>
              </View>

              <View style={styles.contentContainer}>
                {verificationStep ? renderVerificationStep() : renderPhoneStep()}
              </View>

              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#FFD700" />
                  <Text style={styles.loadingText}>
                    {isRegistering ? 'Hesap oluşturuluyor...' : 'Giriş yapılıyor...'}
                  </Text>
                </View>
              )}
            </Animated.View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <CustomAlertModal
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  contentContainer: {
    marginBottom: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 15,
  },
  countryCode: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 215, 0, 0.3)',
  },
  countryCodeText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  phoneInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 15,
  },
  inputIcon: {
    paddingHorizontal: 15,
  },
  textInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 15,
    paddingRight: 15,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  switchButton: {
    alignItems: 'center',
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
  verificationContainer: {
    alignItems: 'center',
  },
  verificationTitle: {
    fontSize: 24,
    color: '#FFD700',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  codeInputContainer: {
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    color: 'white',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    letterSpacing: 10,
    width: 200,
  },
  timerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 15,
  },
  resendText: {
    color: '#FFD700',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 15,
    textDecorationLine: 'underline',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  loadingText: {
    color: '#FFD700',
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
});

export default ModernLoginScreen;