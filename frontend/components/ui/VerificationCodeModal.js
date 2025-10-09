import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';

const VerificationCodeModal = ({ 
  visible, 
  onClose, 
  onVerify, 
  phoneNumber, 
  onResendCode,
  timeLeft,
  loading,
  error 
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // İlk inputa odaklan
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 400);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      setCode(['', '', '', '', '', '']);
    }
  }, [visible]);

  const handleCodeChange = (text, index) => {
    if (text.length > 1) return; // Sadece bir karakter
    
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Otomatik olarak bir sonraki inputa geç
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Kod tamamlandığında otomatik doğrulama
    if (newCode.every(digit => digit !== '')) {
      const fullCode = newCode.join('');
      onVerify(fullCode);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      // Geri tuşuna basıldığında ve input boşsa bir öncekine git
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const modalTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.modalContent,
            { 
              transform: [{ translateY: modalTranslateY }],
              opacity: fadeAnim
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Doğrulama Kodu</Text>
            <Text style={styles.subtitle}>
              {phoneNumber} numarasına gönderilen 6 haneli kodu girin
            </Text>
          </View>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => inputRefs.current[index] = ref}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  error && styles.codeInputError
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                placeholder="-"
                placeholderTextColor="#999"
                editable={!loading}
                selectTextOnFocus
              />
            ))}
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {timeLeft > 0 
                ? `Kalan süre: ${formatTime(timeLeft)}` 
                : 'Süre doldu'
              }
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.verifyButton,
                loading && styles.buttonDisabled
              ]}
              onPress={() => onVerify(code.join(''))}
              disabled={loading || code.some(digit => !digit)}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Doğrulanıyor...' : 'Doğrula'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.resendButton,
                (timeLeft > 0 || loading) && styles.buttonDisabled
              ]}
              onPress={onResendCode}
              disabled={timeLeft > 0 || loading}
            >
              <Text style={styles.resendButtonText}>
                Kodu Tekrar Gönder
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>
                İptal
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#16213e',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  codeInputFilled: {
    borderColor: '#00D9CC',
    backgroundColor: '#1e3a1e',
  },
  codeInputError: {
    borderColor: '#E61A8D',
    backgroundColor: '#3a1e1e',
  },
  errorText: {
    color: '#E61A8D',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 16,
    color: '#999',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#6E00B3',
  },
  resendButton: {
    backgroundColor: '#E61A8D',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default VerificationCodeModal;