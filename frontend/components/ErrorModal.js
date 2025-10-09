import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ErrorModal = ({ visible, error, onClose }) => {
  if (!visible || !error) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#6E00B3', '#E61A8D', '#00D9CC']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={styles.header}>
            <Text style={styles.title}>❌ Hata</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 20,
    padding: 25,
    width: width * 0.85,
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#00D9CC',
    shadowColor: '#E61A8D',
    shadowOffset: {
      width: 0,
      height: 10,
    },
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
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#00D9CC',
    textAlign: 'center',
  },
  content: {
    marginBottom: 25,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
  },
  button: {
    backgroundColor: '#00D9CC',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#E61A8D',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: '600',
  },
});

export default ErrorModal;