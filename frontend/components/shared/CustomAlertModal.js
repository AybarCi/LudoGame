import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CustomAlertModal = ({ 
  visible, 
  title, 
  message, 
  onClose, 
  type = 'info'
}) => {
  console.log('🟢 CustomAlertModal RENDER - visible:', visible, 'title:', title, 'message:', message, 'type:', type);
  
  // Add debug for modal visibility
  React.useEffect(() => {
    console.log('🟡 CustomAlertModal visibility changed:', visible);
    console.log('🟡 Modal will be', visible ? 'VISIBLE' : 'HIDDEN');
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#00D9CC';
      case 'error':
        return '#E61A8D';
      case 'warning':
        return '#E61A8D';
      default:
        return '#00D9CC';
    }
  };

  console.log('🟢 ABOUT TO RENDER MODAL COMPONENT');
  if (!visible) {
    console.log('🔴 Modal not visible, returning null');
    return null;
  }

  console.log('🟢 Modal VISIBLE, rendering...');
  
  // Modal yerine basit bir View ile test
  return (
    <View style={[styles.overlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }]}>
      <View style={styles.modalContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={onClose}
        >
          <Text style={styles.buttonText}>
            Tamam
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: width * 0.8,
    maxWidth: 350,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#6E00B3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CustomAlertModal;