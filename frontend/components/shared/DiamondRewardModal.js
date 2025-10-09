// DiamondRewardModal.js - Elmas ödül modalı
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DiamondService } from '../../services/DiamondService';
import { AdService } from '../../services/AdService';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../store/slices/alertSlice';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

const DiamondRewardModal = ({ visible, onClose, rewardType = 'ad' }) => {
  const [diamonds, setDiamonds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [diamondAnim] = useState(new Animated.Value(0));
  const dispatch = useDispatch();

  useEffect(() => {
    if (visible) {
      loadDiamonds();
      // Modal açılma animasyonu
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      scaleAnim.setValue(0);
      diamondAnim.setValue(0);
    }
  }, [visible]);

  const loadDiamonds = async () => {
    const currentDiamonds = await DiamondService.getDiamonds();
    setDiamonds(currentDiamonds);
  };

  const handleWatchAd = async () => {
    setIsLoading(true);
    try {
      const result = await AdService.showRewardedAd();
      if (result.userDidWatchAd) {
        const newTotal = await DiamondService.rewardForAd();
        setDiamonds(newTotal);
        
        // Elmas kazanma animasyonu
        Animated.sequence([
          Animated.timing(diamondAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(diamondAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        Alert.alert(
          '🎉 Tebrikler!',
          '2 elmas kazandınız!',
          [
            {
              text: 'Tamam',
              onPress: onClose
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
          'Hata',
          'Reklam gösterilirken bir hata oluştu.',
          [
            {
              text: 'Tamam'
            }
          ]
        );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimDaily = async () => {
    setIsLoading(true);
    try {
      const result = await DiamondService.claimDailyReward();
      if (result.success) {
        setDiamonds(result.newTotal);
        
        // Elmas kazanma animasyonu
        Animated.sequence([
          Animated.timing(diamondAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(diamondAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        Alert.alert(
          '🎉 Günlük Ödül!',
          `${result.amount} elmas kazandınız!`,
          [
            {
              text: 'Tamam',
              onPress: onClose
            }
          ]
        );
      } else {
        Alert.alert(
          'Bilgi',
          result.message,
          [
            {
              text: 'Tamam',
              onPress: onClose
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
          'Hata',
          'Günlük ödül alınırken bir hata oluştu.',
          [
            {
              text: 'Tamam'
            }
          ]
        );
    } finally {
      setIsLoading(false);
    }
  };

  const getModalContent = () => {
    switch (rewardType) {
      case 'ad':
        return {
          title: '💎 Elmas Kazan',
          subtitle: 'Reklam izleyerek 2 elmas kazanın!',
          buttonText: 'Reklam İzle',
          onPress: handleWatchAd,
        };
      case 'daily':
        return {
          title: '🎁 Günlük Ödül',
          subtitle: 'Günlük hediyenizi almayı unutmayın!',
          buttonText: 'Ödülü Al',
          onPress: handleClaimDaily,
        };
      default:
        return {
          title: '💎 Elmas',
          subtitle: 'Elmas kazanın!',
          buttonText: 'Tamam',
          onPress: onClose,
        };
    }
  };

  const content = getModalContent();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#6E00B3', '#E61A8D']}
            style={styles.modalGradient}
          >
            {/* Elmas animasyonu */}
            <Animated.View 
              style={[
                styles.diamondAnimation,
                {
                  opacity: diamondAnim,
                  transform: [
                    { scale: diamondAnim },
                    { translateY: diamondAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -50]
                    })}
                  ]
                }
              ]}
            >
              <Ionicons name="diamond" size={40} color="#00D9CC" />
              <Text style={styles.animationText}>+2</Text>
            </Animated.View>

            <View style={styles.currentDiamonds}>
              <Ionicons name="diamond" size={24} color="#00D9CC" />
              <Text style={styles.diamondCount}>{diamonds}</Text>
            </View>

            <Text style={styles.modalTitle}>{content.title}</Text>
            <Text style={styles.modalSubtitle}>{content.subtitle}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={content.onPress}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#00D9CC', '#00b3a6']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Yükleniyor...' : content.buttonText}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: isTablet ? '50%' : '85%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
  },
  modalGradient: {
    padding: 30,
    alignItems: 'center',
    position: 'relative',
  },
  diamondAnimation: {
    position: 'absolute',
    top: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  animationText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  currentDiamonds: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  diamondCount: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: isTablet ? 16 : 14,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButton: {
    elevation: 3,
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFF',
    fontSize: isTablet ? 16 : 14,
    fontWeight: '600',
    opacity: 0.8,
  },
});

export default DiamondRewardModal;