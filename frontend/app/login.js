import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Image,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@rneui/themed';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { 
  sendVerificationCode, 
  signInWithPhone, 
  registerWithPhone,
  setPhoneNumber, 
  decrementTimer,
  verifyCode
} from '../store/slices/authSlice';
import { showAlert } from '../store/slices/alertSlice';
import VerificationModal from '../components/VerificationModal';
import { loginStyles as styles } from './login.styles';
import { API_BASE_URL } from '../constants/game';

const API_URL = API_BASE_URL;

// Preload background image to prevent loading delay
const logoImage = require('../assets/images/logo.png');

export default function LoginScreen() {
  console.log('=== LOGIN SCREEN MOUNTED ===');
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    user,
    session,
    timer,
    isAuthenticated
  } = useSelector((state) => state.auth);
  
  console.log('LoginScreen: Auth state:', { user: !!user, session: !!session, isAuthenticated });
  
  const [phoneNumber, setPhoneNumberState] = useState('');
  const [nickname, setNickname] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showNicknameScreen, setShowNicknameScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationModalLocal, setShowVerificationModalLocal] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Component mount olduğunda state'leri sıfırla
    setPhoneNumberState('');
    setNickname('');
    setVerificationCode('');
    setShowNicknameScreen(false);
    setLoading(false);
    setShowVerificationModalLocal(false);
    
    // Start animations immediately
    setTimeout(() => {
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
    }, 300);

    // Cleanup function - component unmount olduğunda
    return () => {
      setPhoneNumberState('');
      setNickname('');
      setVerificationCode('');
      setShowNicknameScreen(false);
      setLoading(false);
      setShowVerificationModalLocal(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        dispatch(decrementTimer());
      }, 1000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);



  const handlePhoneNumberChange = (text) => {
    // Sadece rakamları al
    const cleaned = text.replace(/\D/g, '');
    
    // Backend'in beklediği format: 5xx xxx xx xx
    let formatted = cleaned;
    if (cleaned.length > 0) {
      if (cleaned.length <= 3) {
        formatted = cleaned;
      } else if (cleaned.length <= 6) {
        formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
      } else if (cleaned.length <= 8) {
        formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
      } else if (cleaned.length <= 10) {
        formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
      }
    }
    
    setPhoneNumberState(formatted);
  };

  const validatePhoneNumber = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length === 10 && cleaned.startsWith('5');
  };

  const getCleanPhoneNumber = (phone) => {
    // Backend'e gönderilecek temiz telefon numarası (boşluksuz)
    return phone.replace(/\D/g, '');
  };

  async function handleSignIn() {
    console.log('=== LOGIN BUTONUNA BASILDI ===');
    console.log('API_URL:', API_URL);
    
    if (!validatePhoneNumber()) {
      dispatch(showAlert({ message: 'Lütfen geçerli bir telefon numarası girin. (5xx xxx xx xx)', type: 'error' }));
      return;
    }
    
    const cleanPhoneNumber = getCleanPhoneNumber(phoneNumber);
    console.log('Gönderilecek telefon numarası:', cleanPhoneNumber);
    console.log('Request endpoint:', `${API_URL}/api/send-sms-code`);
    console.log('Request body:', JSON.stringify({ phoneNumber: cleanPhoneNumber }));
    
    dispatch(setPhoneNumber(cleanPhoneNumber));
    
    try {
      const result = await dispatch(sendVerificationCode(cleanPhoneNumber));
      console.log('Response result:', result);
      
      if (sendVerificationCode.fulfilled.match(result)) {
        console.log('✅ SMS kodu başarıyla gönderildi');
        setShowVerificationModalLocal(true);
      } else if (sendVerificationCode.rejected.match(result)) {
        console.log('❌ SMS kodu gönderilemedi:', result.payload);
        dispatch(showAlert({ message: result.payload, type: 'error' }));
      }
    } catch (error) {
      console.log('🚨 Exception during SMS send:', error);
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
    }
  }

  async function handleResendCode() {
    if (timer > 0) return;
    
    // Clear the verification code input
    setVerificationCode('');
    
    const cleanPhoneNumber = getCleanPhoneNumber(phoneNumber);
    const result = await dispatch(sendVerificationCode(cleanPhoneNumber));
    
    if (sendVerificationCode.fulfilled.match(result)) {
      dispatch(showAlert({ 
        message: 'Telefonunuza doğrulama kodu gönderildi. (Demo: Kod konsolda)', 
        type: 'success' 
      }));
    } else if (sendVerificationCode.rejected.match(result)) {
      dispatch(showAlert({ message: result.payload, type: 'error' }));
    }
  }

  async function handleVerifyCode(code) {
    if (!code || code.length !== 6) {
      dispatch(showAlert({ message: 'Lütfen 6 haneli doğrulama kodunu girin.', type: 'error' }));
      return;
    }

    setLoading(true);
    setVerificationCode(code); // Store the verification code for registration

    try {
      const cleanPhoneNumber = getCleanPhoneNumber(phoneNumber);
      
      // First verify the code
      const verifyResult = await dispatch(verifyCode({ phoneNumber: cleanPhoneNumber, code: code }));
      
      if (verifyCode.rejected.match(verifyResult)) {
        // Hata mesajını verification modal'ı içinde göster, ayrıca alert gösterme
        // Bu sayede sadece bir modal açık kalır
        setLoading(false);
        throw new Error(verifyResult.payload || 'Doğrulama kodu hatalı'); // Hata fırlat ki modal catch yapsın
      }
      
      // Code verified successfully, check if user exists
      if (verifyResult.payload.userExists) {
        // User exists, check if they have a nickname
        const userData = verifyResult.payload.user;
        
        // Close the modal
        setShowVerificationModalLocal(false);
        
        if (!userData.nickname || userData.nickname.trim() === '') {
          // User exists but doesn't have a nickname, show nickname screen
          setShowNicknameScreen(true);
        } else {
          // User has nickname, generate tokens and login
          const result = await dispatch(signInWithPhone({ phoneNumber: cleanPhoneNumber, code: code }));
          
          if (signInWithPhone.fulfilled.match(result)) {
            // Login successful, go to home
            // Navigate to home screen
            router.push('/(auth)/home');
          } else {
            dispatch(showAlert({ message: result.payload || 'Giriş başarısız', type: 'error' }));
            setLoading(false); // Butonun tekrar aktif olması için
          }
        }
      } else {
        // User doesn't exist, show nickname screen to register
        setShowVerificationModalLocal(false);
        setShowNicknameScreen(true);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setLoading(false); // Butonun tekrar aktif olması için
      throw error; // Hatayı yukarı fırlat ki modal catch yapsın
    } finally {
      setLoading(false);
    }
  }

  async function handleNicknameSubmit() {
    if (!nickname.trim()) {
      dispatch(showAlert({ message: 'Lütfen bir rumuz girin.', type: 'error' }));
      return;
    }
    
    if (nickname.length < 3) {
      dispatch(showAlert({ message: 'Rumuz en az 3 karakter olmalıdır.', type: 'error' }));
      return;
    }
    
    setLoading(true);
    
    try {
      const cleanPhoneNumber = getCleanPhoneNumber(phoneNumber);
      
      // Register the user with phone, verification code, and nickname
      const result = await dispatch(registerWithPhone({ 
        phoneNumber: cleanPhoneNumber, 
        code: verificationCode, // Store the verification code from previous step
        nickname: nickname.trim() 
      }));

      if (registerWithPhone.fulfilled.match(result)) {
        // Registration successful
        setShowNicknameScreen(false);
        // Navigate to home screen
        router.push('/(auth)/home');
      } else {
        dispatch(showAlert({ message: result.payload || 'Kayıt başarısız', type: 'error' }));
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      dispatch(showAlert({ message: 'Kayıt sırasında hata oluştu', type: 'error' }));
    } finally {
      setLoading(false);
    }
  }

  const handlePrivacyPress = () => {
    Linking.openURL('https://ludoturco.com/privacy').catch(() => {
      dispatch(showAlert({ message: 'Gizlilik politikası sayfası açılamadı', type: 'error' }));
    });
  };

  const handleTermsPress = () => {
    Linking.openURL('https://ludoturco.com/terms').catch(() => {
      dispatch(showAlert({ message: 'Kullanım şartları sayfası açılamadı', type: 'error' }));
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6E00B3', '#E61A8D', '#00D9CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      >
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
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
              {/* Logo */}
              <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
              </Animated.View>
              <Text style={styles.subtitle}>
                {showNicknameScreen 
                  ? 'Oyun içinde görünecek rumuzunu belirle' 
                  : 'Telefon numaranla giriş yap'
                }
              </Text>
            </View>

            <View style={styles.inputsContainer}>
              {showNicknameScreen ? (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Rumuz (3-20 karakter)"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={nickname}
                    onChangeText={setNickname}
                    maxLength={20}
                    autoFocus
                    // Placeholder styling için ek özellikler
                    selectionColor="#00D9CC"
                    cursorColor="#00D9CC"
                    // iOS için
                    tintColor="#00D9CC"
                    // Android için
                    underlineColorAndroid="transparent"
                  />
                </View>
              ) : (
                <View style={styles.inputWrapper}>
                  <View style={styles.phoneInputContainer}>
                    <View style={styles.countryCode}>
                      <Text style={styles.countryCodeText}>+90</Text>
                    </View>
                    <TextInput
                    style={styles.phoneInput}
                    placeholder="Telefon Numarası"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    maxLength={14}
                    // Placeholder styling için ek özellikler
                    selectionColor="#00D9CC"
                    cursorColor="#00D9CC"
                    // iOS için
                    tintColor="#00D9CC"
                    // Android için
                    underlineColorAndroid="transparent"
                  />
                  </View>
                </View>
              )}
            </View>

            <View style={styles.buttonsContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#00D9CC" />
                  <Text style={styles.loadingText}>
                    {showNicknameScreen
                      ? 'Rumuz kaydediliyor...'
                      : 'Doğrulama kodu gönderiliyor...'
                    }
                  </Text>
                </View>
              ) : (
                <>
                  {showNicknameScreen ? (
                    <TouchableOpacity style={styles.primaryButton} onPress={handleNicknameSubmit}>
                      <Text style={styles.primaryButtonText}>
                        ✅ Rumuzumu Kaydet
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
                      <Text style={styles.primaryButtonText}>
                        📱 Giriş Yap
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* Gizlilik ve Kullanım Şartları Linkleri */}
            <View style={styles.legalContainer}>
              <TouchableOpacity style={styles.legalLink} onPress={handlePrivacyPress}>
                <Text style={styles.legalLinkText}>Gizlilik Politikası</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}>•</Text>
              <TouchableOpacity style={styles.legalLink} onPress={handleTermsPress}>
                <Text style={styles.legalLinkText}>Kullanım Şartları</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <VerificationModal
        visible={showVerificationModalLocal}
        onClose={() => {
          setShowVerificationModalLocal(false);
          setVerificationCode(''); // Clear verification code when modal closes
          setLoading(false); // Modal kapanırken loading state'ini sıfırla
          setTimeout(() => {
            setLoading(false); // Ekstra güvenlik için tekrar sıfırla
          }, 100);
        }}
        onVerify={handleVerifyCode}
        phoneNumber={phoneNumber}
        timer={timer}
        onResend={handleResendCode}
        loading={loading}
      />
      
      </LinearGradient>
    </View>);
};
