import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DiamondService } from '../../services/DiamondService';
import { AdService } from '../../services/AdService';
import DiamondDisplay from '../../components/shared/DiamondDisplay';
import { useDispatch, useSelector } from 'react-redux';
import { showAlert } from '../../store/slices/alertSlice';
import { addDiamonds } from '../../store/slices/diamondSlice';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

export default function EarnDiamonds() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [diamondRefresh, setDiamondRefresh] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const diamondAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
    
    // Giriş animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadData = async () => {
    const dailyAvailable = await DiamondService.canClaimDailyReward();
    setCanClaimDaily(dailyAvailable);
  };

  const dispatchAlert = (title, message, type = 'info') => {
    dispatch(showAlert({ title, message, type }));
  };

  const handleWatchAd = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const adResult = await AdService.showRewardedAd();
      
      // Sadece reklam tamamen izlendiyse ödül ver
      if (adResult.userDidWatchAd) {
        // Reklam izleme ödülü (1 elmas) - DiamondService zaten Redux store'u güncelliyor
        await DiamondService.rewardForAd();
        setDiamondRefresh(prev => prev + 1);
        
        // Elmas kazanma animasyonu
        Animated.sequence([
          Animated.timing(diamondAnim, {
            toValue: 1.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(diamondAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        dispatchAlert('🎉 Tebrikler!', '1 elmas kazandınız!', 'success');
      } else {
        // Reklam izlenmediyse bilgi mesajı göster
        dispatchAlert('Bilgi', 'Reklam izleme tamamlanmadı. Lütfen tekrar deneyin.', 'info');
      }
    } catch (_error) {
      dispatchAlert('Bilgi', 'Reklam şu anda mevcut değil. Lütfen daha sonra tekrar deneyin.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimDaily = async () => {
    if (isLoading || !canClaimDaily) return;
    
    setIsLoading(true);
    try {
      const result = await DiamondService.claimDailyReward();
      if (result) {
        setCanClaimDaily(false);
        // DiamondService.claimDailyReward zaten Redux store'u güncelliyor
        setDiamondRefresh(prev => prev + 1);
        
        // Elmas kazanma animasyonu
        Animated.sequence([
          Animated.timing(diamondAnim, {
            toValue: 1.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(diamondAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        dispatchAlert('🎁 Günlük Ödül!', '5 elmas kazandınız!', 'success');
      } else {
        dispatchAlert('Bilgi', 'Günlük ödülünüzü zaten aldınız. Yarın tekrar gelin!', 'info');
      }
    } catch (_error) {
      dispatchAlert('Hata', 'Günlük ödül alınırken bir hata oluştu.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#6E00B3', '#4A0080', '#2A0055']}
        style={styles.background}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFD700" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Elmas Kazan</Text>
            </View>
            
            <Animated.View style={{ transform: [{ scale: diamondAnim }] }}>
              <DiamondDisplay refreshTrigger={diamondRefresh} />
            </Animated.View>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View
              style={[
                styles.cardContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Reklam İzle Kartı */}
              <View style={styles.card}>
                <LinearGradient
                  colors={['#6E00B3', '#4A0080']}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="play-circle" size={50} color="#FFD700" />
                  </View>
                  
                  <Text style={styles.cardTitle}>Reklam İzle</Text>
                  
                  <Text style={styles.cardDescription}>
                    Kısa bir reklam izleyerek ücretsiz elmas kazanın!
                  </Text>
                  
                  <View style={styles.rewardContainer}>
                    <View style={styles.rewardBadge}>
                      <Ionicons name="diamond" size={24} color="#FFD700" />
                      <Text style={styles.rewardAmount}>+1</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, isLoading && styles.disabledButton]}
                    onPress={handleWatchAd}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#00D9CC', '#00B8A6']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.actionButtonText}>
                        {isLoading ? 'Yükleniyor...' : 'Reklam İzle'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Günlük Ödül Kartı */}
              <View style={styles.card}>
                <LinearGradient
                  colors={canClaimDaily ? ['#E61A8D', '#C71585'] : ['#4A0080', '#6E00B3']}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.cardIconContainer, !canClaimDaily && { backgroundColor: 'rgba(155, 161, 166, 0.2)' }]}>
                    <Ionicons name="gift" size={50} color={canClaimDaily ? '#FFD700' : '#9BA1A6'} />
                  </View>
                  
                  <Text style={[styles.cardTitle, !canClaimDaily && { opacity: 0.7 }]}>Günlük Ödül</Text>
                  
                  <Text style={[styles.cardDescription, !canClaimDaily && { opacity: 0.6 }]}>
                    {canClaimDaily 
                      ? 'Her gün giriş yaparak ücretsiz elmas kazanın!' 
                      : 'Yarın tekrar gelin!'}
                  </Text>
                  
                  <View style={styles.rewardContainer}>
                    <View style={[styles.rewardBadge, !canClaimDaily && styles.disabledRewardBadge]}>
                      <Ionicons name="diamond" size={24} color="#FFD700" />
                      <Text style={[styles.rewardAmount, !canClaimDaily && styles.disabledRewardText]}>+5</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton, 
                      (!canClaimDaily || isLoading) && styles.disabledButton
                    ]}
                    onPress={handleClaimDaily}
                    disabled={!canClaimDaily || isLoading}
                  >
                    <LinearGradient
                      colors={canClaimDaily ? ['#00D9CC', '#00B8A6'] : ['#6E00B3', '#4A0080']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.actionButtonText}>
                        {!canClaimDaily ? 'Alındı' : isLoading ? 'Yükleniyor...' : 'Ödülü Al'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Bilgi Kartı */}
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="bulb" size={28} color="#FFD700" />
                  <Text style={styles.infoTitle}>Elmas Nasıl Kullanılır?</Text>
                </View>
                <View style={styles.infoContent}>
                  <View style={styles.infoItem}>
                    <Ionicons name="diamond" size={18} color="#FFD700" />
                    <Text style={styles.infoText}>Mağazadan özel piyon tasarımları satın alın</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="star" size={18} color="#FFD700" />
                    <Text style={styles.infoText}>Enerjiniz bittiğinde elmas ile enerjinizi doldurun</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6E00B3',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(110, 0, 179, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 217, 204, 0.2)',
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0, 217, 204, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 204, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D9CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 20,
  },
  headerTitle: {
    fontSize: isTablet ? 32 : 28,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  cardContainer: {
    gap: 25,
  },
  card: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#00D9CC',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  cardGradient: {
    padding: 30,
    alignItems: 'center',
  },
  cardIconContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 50,
    padding: 15,
    shadowColor: '#00D9CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  cardTitle: {
    fontSize: isTablet ? 28 : 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: isTablet ? 18 : 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 25,
    opacity: 0.9,
    lineHeight: 24,
    fontFamily: 'Poppins_400Regular',
  },
  rewardContainer: {
    marginBottom: 30,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledRewardBadge: {
    borderColor: 'rgba(155, 161, 166, 0.4)',
    shadowOpacity: 0.1,
    backgroundColor: 'rgba(155, 161, 166, 0.1)',
  },
  rewardAmount: {
    fontSize: 24,
    color: '#6E00B3',
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Poppins_700Bold',
  },
  disabledRewardText: {
    color: '#9BA1A6',
  },
  actionButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingHorizontal: 35,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
  },
  infoCard: {
    backgroundColor: 'rgba(110, 0, 179, 0.2)',
    borderRadius: 20,
    padding: 25,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 204, 0.2)',
    shadowColor: '#00D9CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  infoTitle: {
    fontSize: isTablet ? 22 : 20,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'Poppins_700Bold',
  },
  infoContent: {
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: isTablet ? 16 : 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
});