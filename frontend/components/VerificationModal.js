import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Text } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const VerificationModal = ({ visible, onClose, onVerify, phoneNumber, timer, onResend, loading }) => {
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      setCode('');
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Animasyon tamamlandıktan sonra state'leri temizle
        setCode('');
      });
    }
  }, [visible]);

  // Clear code when modal becomes visible or when resending
  useEffect(() => {
    if (visible) {
      setCode('');
      setErrorMessage(''); // Clear error message when modal opens
    }
  }, [visible]);

  // Loading state değiştiğinde kontrol et
  useEffect(() => {
    // Loading false olduğunda buton tekrar aktif olacak
    // Bu useEffect sayesinde buton durumu güncellenecek
  }, [loading]);

  const handleVerify = async () => {
    if (code.length === 6 && !loading) {
      try {
        setErrorMessage(''); // Hata mesajını temizle
        await onVerify(code);
        // onVerify başarılı olursa modal kapanır (parent component tarafından yönetilir)
      } catch (error) {
        // Hata durumunda kullanıcıya doğrudan feedback ver
        // Hata mesajını console'dan al veya varsayılan mesaj göster
        const errorMsg = error.message || 'Doğrulama kodu hatalı veya süresi dolmuş. Lütfen tekrar deneyin.';
        setErrorMessage(errorMsg);
        // KODU TEMİZLEME! Kullanıcı hatalı kodu görsün ve düzeltebilsin
        console.error('Verification error:', error);
      }
    } else if (code.length !== 6) {
      // Kullanıcı 6 haneden farklı kod girmişse uyarı ver
      setErrorMessage('Lütfen 6 haneli doğrulama kodunu girin.');
    }
  };

  const handleResend = () => {
    setCode(''); // Clear the code input
    setErrorMessage(''); // Clear error message
    onResend();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Arka plan tıklamasını engelle - sadece close butonu ile kapanabilir */}
        <View style={styles.backdrop} />
        
        <Animated.View 
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#6E00B3', '#E61A8D', '#00D9CC']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#00D9CC" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Doğrulama Kodu</Text>
            <Text style={styles.subtitle}>
              +90 {phoneNumber} numarasına gönderilen 6 haneli kodu girin
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.codeInput,
                errorMessage ? styles.codeInputError : null
              ]}
              placeholder="------"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={code}
              onChangeText={(text) => {
                setCode(text);
                if (errorMessage) setErrorMessage(''); // Hata mesajını temizle
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              textAlign="center"
              returnKeyType="done"
              onSubmitEditing={handleVerify}
            />
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Kodu tekrar gönder ({formatTime(timer)})
              </Text>
            ) : (
              <TouchableOpacity 
                style={styles.resendButton}
                onPress={handleResend}
              >
                <Text style={styles.resendButtonText}>
                  Kodu Tekrar Gönder
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[
                styles.verifyButton,
                loading && styles.verifyButtonDisabled
              ]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.verifyButtonText}>Doğrulanıyor...</Text>
              ) : errorMessage ? (
                <Text style={styles.verifyButtonText}>Tekrar Dene</Text>
              ) : (
                <Text style={styles.verifyButtonText}>Doğrula</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = {
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 20,
    padding: 25,
    width: width * 0.85,
    maxWidth: 350,
    borderWidth: 2,
    borderColor: '#00D9CC',
    shadowColor: '#E61A8D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.7,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: '#003366',
    borderRadius: 12,
    padding: 6,
  },
  header: {
    marginBottom: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#00D9CC',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 25,
  },
  codeInput: {
    backgroundColor: 'rgba(0, 217, 204, 0.1)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#00D9CC',
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 24,
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 8,
  },
  codeInputError: {
    borderColor: '#E61A8D',
    backgroundColor: 'rgba(230, 26, 141, 0.1)',
  },
  errorText: {
    color: '#E61A8D',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  actions: {
    alignItems: 'center',
  },
  timerText: {
    color: '#00D9CC',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 15,
  },
  resendButton: {
    marginBottom: 15,
  },
  resendButtonText: {
    color: '#0096FF',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  verifyButton: {
    backgroundColor: '#E61A8D',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#E61A8D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonDisabled: {
    backgroundColor: 'rgba(230, 26, 141, 0.5)',
    shadowOpacity: 0.3,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
};

export default VerificationModal;