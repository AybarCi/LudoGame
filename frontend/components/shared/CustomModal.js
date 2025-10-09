import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CustomModal = ({ 
  visible, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  buttons = []
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#00D9CC' };
      case 'error':
        return { icon: 'close-circle', color: '#E61A8D' };
      case 'warning':
        return { icon: 'warning', color: '#E61A8D' };
      default:
        return { icon: 'information-circle', color: '#00D9CC' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.content}
          >
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon} size={40} color={color} />
            </View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.buttonContainer}>
              {buttons.length > 0 ? (
                buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      button.style === 'primary' ? styles.primaryButton : styles.secondaryButton,
                      buttons.length === 1 && styles.singleButton
                    ]}
                    onPress={button.onPress}
                  >
                    <Text style={[
                      styles.buttonText,
                      button.style === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, styles.singleButton]}
                  onPress={onClose}
                >
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>Tamam</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
  },
  content: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#6E00B3',
  },
  secondaryButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#333',
  },
});

export default CustomModal;