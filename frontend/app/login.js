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

// Rate limit saklama anahtarları
const RATE_LIMIT_STORAGE_KEY = 'rate_limit_info';
const RATE_LIMIT_TIMESTAMP_KEY = 'rate_limit_timestamp';

// Preload background image to prevent loading delay
const logoImage = require('../assets/images/logo.png');

// Rate limit bilgisini AsyncStorage'a kaydet
const saveRateLimitToStorage = async (rateLimitInfo) => {
  try {
    if (rateLimitInfo) {
      const data = {
        ...rateLimitInfo,
        timestamp: Date.now() // Mevcut zaman damgası
      };
      await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(RATE_LIMIT_TIMESTAMP_KEY, Date.now().toString());
    } else {
      await AsyncStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
      await AsyncStorage.removeItem(RATE_LIMIT_TIMESTAMP_KEY);
    }
  } catch (error) {
    console.error('Rate limit bilgisi kaydedilemedi:', error);
  }
};

// Rate limit bilgisini AsyncStorage'dan yükle
const loadRateLimitFromStorage = async () => {
  try {
    const storedData = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const storedTimestamp = await AsyncStorage.getItem(RATE_LIMIT_TIMESTAMP_KEY);
    
    if (!storedData || !storedTimestamp) {
      return null;
    }
    
    const rateLimitInfo = JSON.parse(storedData);
    const timestamp = parseInt(storedTimestamp);
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - timestamp) / 1000);
    
    // Kalan süreyi hesapla
    const remainingSeconds = Math.max(0, rateLimitInfo.retryAfter - elapsedSeconds);
    
    if (remainingSeconds > 0) {
      return {
        ...rateLimitInfo,
        retryAfter: remainingSeconds
      };
    } else {
      // Süre dolmuş, temizle
      await AsyncStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
      await AsyncStorage.removeItem(RATE_LIMIT_TIMESTAMP_KEY);
      return null;
    }
  } catch (error) {
    console.error('Rate limit bilgisi yüklenemedi:', error);
    return null;
  }
};

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
  const [rateLimitInfo, setRateLimitInfo] = useState(null); // Rate limiting bilgisi için
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    console.log('LoginScreen: Initial useEffect running');
    
    // AsyncStorage'dan rate limit bilgisini yükle
    const loadStoredRateLimit = async () => {
      const storedRateLimit = await loadRateLimitFromStorage();
      if (storedRateLimit) {
        console.log('Stored rate limit loaded:', storedRateLimit);
        setRateLimitInfo(storedRateLimit);
      }
    };
    
    loadStoredRateLimit();
    
    // Component mount olduğunda state'leri sıfırla (rate limit hariç)
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
      // Rate limit bilgisini temizleme - uygulama kapatılıp açıldığında devam etmesi için
    };
  }, []); // Boş dependency array - sadece mount/unmount'ta çalışır

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

  // Rate limiting timer için useEffect
  useEffect(() => {
    let interval;
    if (rateLimitInfo && rateLimitInfo.retryAfter > 0) {
      console.log('Rate limit timer started:', rateLimitInfo.retryAfter, 'seconds');
      interval = setInterval(() => {
        setRateLimitInfo(prev => {
          if (prev && prev.retryAfter > 1) {
            const newInfo = { ...prev, retryAfter: prev.retryAfter - 1 };
            // AsyncStorage'a kaydet
            saveRateLimitToStorage(newInfo);
            return newInfo;
          } else {
            console.log('Rate limit timer finished');
            // Süre doldu, rate limit bilgisini temizle
            saveRateLimitToStorage(null);
            return null;
          }
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        console.log('Rate limit timer cleared');
        clearInterval(interval);
      }
    };
  }, [rateLimitInfo?.retryAfter]); // Sadece retryAfter değiştiğinde tetikle



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
    // Rate limit bilgisini sadece başarılı istekte temizle
    // Başarısız istekte mevcut limit bilgisi korunmalı
    
    try {
      const result = await dispatch(sendVerificationCode(cleanPhoneNumber));
      console.log('Response result:', result);
      
      if (sendVerificationCode.fulfilled.match(result)) {
        console.log('✅ SMS kodu başarıyla gönderildi');
        setRateLimitInfo(null); // Başarılı istekte rate limit bilgisini temizle
        await saveRateLimitToStorage(null); // AsyncStorage'dan da temizle
        setShowVerificationModalLocal(true);
      } else if (sendVerificationCode.rejected.match(result)) {
        console.log('❌ SMS kodu gönderilemedi:', result.payload);
        // Rate limiting hatası mı kontrol et
        const errorMessage = result.payload;
        if (errorMessage && errorMessage.includes('dakika')) {
          // Dakika içeren mesajdan süreyi çıkar
          const match = errorMessage.match(/(\d+)\s*dakika/);
          const minutes = match ? parseInt(match[1]) : 1;
          const newRetryAfter = minutes * 60;
          
          // Sadece daha uzun bir süre geldiğinde veya yeni bir limit durumu oluştuğunda güncelle
          if (!rateLimitInfo || newRetryAfter > rateLimitInfo.retryAfter) {
            const rateLimitData = {
              type: 'sms',
              retryAfter: newRetryAfter,
              message: errorMessage
            };
            setRateLimitInfo(rateLimitData);
            await saveRateLimitToStorage(rateLimitData); // AsyncStorage'a kaydet
          }
        }
        // Rate limiting hatası varsa sadece modalda göster, alert gösterme
        if (!errorMessage.includes('dakika')) {
          dispatch(showAlert({ message: errorMessage, type: 'error' }));
        }
        // Rate limiting hatası zaten UI'da gösteriliyor, tekrar gösterme
        // Bu sayede mesaj sadece bir kez (modalda) gösterilir
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
      // Başarılı SMS gönderimi - sadece modalda göster
      console.log('✅ SMS kodu başarıyla gönderildi');
    } else if (sendVerificationCode.rejected.match(result)) {
      // Rate limiting hatası varsa sadece modalda göster, alert gösterme
      if (!result.payload.includes('dakika')) {
        dispatch(showAlert({ message: result.payload, type: 'error' }));
      }
    }
  }

  async function handleVerifyCode(code) {
    if (!code || code.length !== 6) {
      dispatch(showAlert({ message: 'Lütfen 6 haneli doğrulama kodunu girin.', type: 'error' }));
      return;
    }

    setLoading(true);
    setVerificationCode(code); // Store the verification code for registration
    // Rate limit bilgisini sadece başarılı doğrulamada temizle

    try {
      const cleanPhoneNumber = getCleanPhoneNumber(phoneNumber);
      
      // First verify the code
      const verifyResult = await dispatch(verifyCode({ phoneNumber: cleanPhoneNumber, code: code }));
      
      if (verifyCode.rejected.match(verifyResult)) {
        // Hata mesajını verification modal'ı içinde göster, ayrıca alert gösterme
        // Bu sayede sadece bir modal açık kalır
        setLoading(false);
        
        // Rate limiting hatası mı kontrol et
        const errorMessage = verifyResult.payload;
        if (errorMessage && errorMessage.includes('dakika')) {
          const match = errorMessage.match(/(\d+)\s*dakika/);
          const minutes = match ? parseInt(match[1]) : 1;
          const newRetryAfter = minutes * 60;
          
          // Sadece daha uzun bir süre geldiğinde veya yeni bir limit durumu oluştuğunda güncelle
          if (!rateLimitInfo || newRetryAfter > rateLimitInfo.retryAfter) {
            const rateLimitData = {
              type: 'verification',
              retryAfter: newRetryAfter,
              message: errorMessage
            };
            setRateLimitInfo(rateLimitData);
            await saveRateLimitToStorage(rateLimitData); // AsyncStorage'a kaydet
          }
        }
        
        throw new Error(errorMessage || 'Doğrulama kodu hatalı'); // Hata fırlat ki modal catch yapsın
      }
      
      // Code verified successfully, check response
      const responseData = verifyResult.payload;
      
      // Close the modal
      setShowVerificationModalLocal(false);
      
      if (responseData.needsNickname) {
        // New user or user without nickname, show nickname screen
        setShowNicknameScreen(true);
      } else {
        // User has nickname, generate tokens and login
        const result = await dispatch(signInWithPhone({ phoneNumber: cleanPhoneNumber, code: code }));
        
        if (signInWithPhone.fulfilled.match(result)) {
          // Login successful, check user data and go to home
          console.log('[Login] signInWithPhone successful, user data:', result.payload.user);
          
          // Kullanıcı verisini kontrol et ve gerekirse yenile
          if (result.payload.user && !result.payload.user.phoneNumber && !result.payload.user.maskedPhone) {
            console.log('[Login] User phone data missing, attempting to refresh profile...');
            // Kullanıcı profilini yenilemek için kısa bir bekleme
            setTimeout(async () => {
              try {
                const refreshResponse = await fetch(`${API_URL}/api/user/profile`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${result.payload.token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (refreshResponse.ok) {
                  const refreshData = await refreshResponse.json();
                  console.log('[Login] Profile refresh successful:', refreshData);
                  // Store updated user data
                  if (refreshData.success && refreshData.user) {
                    await AsyncStorage.setItem('user', JSON.stringify(refreshData.user));
                  }
                }
              } catch (refreshError) {
                console.log('[Login] Profile refresh failed:', refreshError);
              }
            }, 500);
          }
          
          router.push('/(auth)/home');
        } else {
          dispatch(showAlert({ message: result.payload || 'Giriş başarısız', type: 'error' }));
          setLoading(false); // Butonun tekrar aktif olması için
        }
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
        console.log('[Login] registerWithPhone successful, user data:', result.payload.user);
        
        // Kullanıcı verisini kontrol et ve gerekirse yenile
        if (result.payload.user && !result.payload.user.phoneNumber && !result.payload.user.maskedPhone) {
          console.log('[Login] Registration: User phone data missing, attempting to refresh profile...');
          // Kullanıcı profilini yenilemek için kısa bir bekleme
          setTimeout(async () => {
            try {
              const refreshResponse = await fetch(`${API_URL}/api/user/profile`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${result.payload.token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                console.log('[Login] Registration: Profile refresh successful:', refreshData);
                // Store updated user data
                if (refreshData.success && refreshData.user) {
                  await AsyncStorage.setItem('user', JSON.stringify(refreshData.user));
                }
              }
            } catch (refreshError) {
              console.log('[Login] Registration: Profile refresh failed:', refreshError);
            }
          }, 500);
        }
        
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRateLimitTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} dakika ${secs} saniye`;
    }
    return `${secs} saniye`;
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
                  {rateLimitInfo && (
                    <View style={styles.rateLimitContainer}>
                      <Text style={styles.rateLimitText}>
                        ⏰ {rateLimitInfo.message} 
                        <Text style={styles.rateLimitTimer}>
                          ({formatRateLimitTime(rateLimitInfo.retryAfter)})
                        </Text>
                      </Text>
                    </View>
                  )}
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
