import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Text } from '@rneui/themed';
import { useDispatch } from 'react-redux';
import { sendVerificationCode, signInWithPhone } from '../store/slices/authSlice';

const { width } = Dimensions.get('window');

// Lightweight development login screen
const LoginScreenDev = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStep, setVerificationStep] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();

  const handlePhoneNumberChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
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
    setPhoneNumber(formatted);
  };

  const getCleanPhoneNumber = (phone) => phone.replace(/\D/g, '');

  const handleSignIn = async () => {
    const cleanPhone = getCleanPhoneNumber(phoneNumber);
    if (cleanPhone.length !== 10) {
      alert('Lütfen geçerli bir telefon numarası girin (5xx xxx xx xx)');
      return;
    }
    
    setLoading(true);
    const result = await dispatch(sendVerificationCode(cleanPhone));
    setLoading(false);
    
    if (sendVerificationCode.rejected.match(result)) {
      alert(result.payload || 'Doğrulama kodu gönderilemedi');
    } else {
      setVerificationStep(true);
      alert('Doğrulama kodu gönderildi! (Demo: 123456)');
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      alert('Lütfen 6 haneli kodu girin');
      return;
    }

    setLoading(true);
    const cleanPhone = getCleanPhoneNumber(phoneNumber);
    const result = await dispatch(signInWithPhone({ phoneNumber: cleanPhone, verificationCode }));
    setLoading(false);
    
    if (signInWithPhone.fulfilled.match(result)) {
      // Giriş başarılı, yönlendirme SplashScreen tarafından yapılacak
    } else {
      alert(result.payload || 'Giriş başarısız');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>LUDO TURCO</Text>
        <Text style={styles.subtitle}>DEV MODE - Hızlı Giriş</Text>
        
        {!verificationStep ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="5xx xxx xx xx"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              maxLength={13}
            />
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Gönderiliyor...' : 'Kod Gönder'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor="#999"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6}
            />
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setVerificationStep(false)}
            >
              <Text style={styles.backButtonText}>Geri Dön</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: width * 0.9,
    maxWidth: 400,
    padding: 20,
    backgroundColor: '#16213e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#0f3460',
    color: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#533483',
  },
  button: {
    backgroundColor: '#e94560',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#999',
    fontSize: 14,
  },
});

export default LoginScreenDev;