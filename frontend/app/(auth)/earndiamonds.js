import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
  Alert,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DiamondService } from '../../services/DiamondService';
import { AdService } from '../../services/AdService';
import DiamondDisplay from '../../components/shared/DiamondDisplay';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

export default function EarnDiamonds() {
  const router = useRouter();
  const [diamonds, setDiamonds] = useState(0);
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
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = async () => {
    const currentDiamonds = await DiamondService.getDiamonds();
    const dailyAvailable = await DiamondService.canClaimDailyReward();
    setDiamonds(currentDiamonds);
    setCanClaimDaily(dailyAvailable);
  };

  const handleWatchAd = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await AdService.showRewardedAd();
      
      // Reklam izleme ödülü (1 elmas)
      const newTotal = await DiamondService.rewardForAd();
      setDiamonds(newTotal);
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
      
      Alert.alert(
        '🎉 Tebrikler!',
        '1 elmas kazandınız!',
        [{ text: 'Tamam' }]
      );
    } catch (error) {
      Alert.alert(
        'Bilgi',
        'Reklam şu anda mevcut değil. Lütfen daha sonra tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
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
        setDiamonds(result);
        setCanClaimDaily(false);
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
        
        Alert.alert(
          '🎁 Günlük Ödül!',
          '5 elmas kazandınız!',
          [{ text: 'Tamam' }]
        );
      } else {
        Alert.alert(
          'Bilgi',
          'Günlük ödülünüzü zaten aldınız. Yarın tekrar gelin!',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Hata',
        'Günlük ödül alınırken bir hata oluştu.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../../assets/images/wood-background.png')} style={styles.background}>
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
        style={styles.gradient}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>💎 Elmas Kazan</Text>
            
            <Animated.View style={{ transform: [{ scale: diamondAnim }] }}>
              <DiamondDisplay refreshTrigger={diamondRefresh} />
            </Animated.View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                  colors={['#FF6B35', '#FF8E53']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="play-circle" size={40} color="#FFF" />
                    <Text style={styles.cardTitle}>Reklam İzle</Text>
                  </View>
                  
                  <Text style={styles.cardDescription}>
                    Kısa bir reklam izleyerek 1 elmas kazanın!
                  </Text>
                  
                  <View style={styles.rewardInfo}>
                    <Ionicons name="diamond" size={20} color="#FFD700" />
                    <Text style={styles.rewardText}>+1 Elmas</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, isLoading && styles.disabledButton]}
                    onPress={handleWatchAd}
                    disabled={isLoading}
                  >
                    <Text style={styles.actionButtonText}>
                      {isLoading ? 'Yükleniyor...' : 'Reklam İzle'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Günlük Ödül Kartı */}
              <View style={styles.card}>
                <LinearGradient
                  colors={canClaimDaily ? ['#4CAF50', '#66BB6A'] : ['#757575', '#9E9E9E']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardHeader}>
                    <Ionicons name="gift" size={40} color="#FFF" />
                    <Text style={styles.cardTitle}>Günlük Ödül</Text>
                  </View>
                  
                  <Text style={styles.cardDescription}>
                    {canClaimDaily 
                      ? 'Günlük hediyenizi almayı unutmayın!' 
                      : 'Yarın tekrar gelin!'}
                  </Text>
                  
                  <View style={styles.rewardInfo}>
                    <Ionicons name="diamond" size={20} color="#FFD700" />
                    <Text style={styles.rewardText}>+5 Elmas</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton, 
                      (!canClaimDaily || isLoading) && styles.disabledButton
                    ]}
                    onPress={handleClaimDaily}
                    disabled={!canClaimDaily || isLoading}
                  >
                    <Text style={styles.actionButtonText}>
                      {!canClaimDaily ? 'Alındı' : isLoading ? 'Yükleniyor...' : 'Ödülü Al'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Bilgi Kartı */}
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>💡 Elmas Nasıl Kullanılır?</Text>
                <Text style={styles.infoText}>
                  • Mağazadan özel piyon tasarımları satın alın{"\n"}
                  • Oyun içi özel özellikler açın{"\n"}
                  • Daha fazla özelleştirme seçeneği edinin
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: isTablet ? 28 : 24,
    color: '#FFD700',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardContainer: {
    gap: 20,
    paddingBottom: 30,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 25,
    alignItems: 'center',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: isTablet ? 24 : 20,
    color: '#FFF',
    fontWeight: 'bold',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardDescription: {
    fontSize: isTablet ? 18 : 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
    lineHeight: 22,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  rewardText: {
    fontSize: isTablet ? 18 : 16,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 150,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  actionButtonText: {
    color: '#333',
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoTitle: {
    fontSize: isTablet ? 20 : 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: isTablet ? 16 : 14,
    color: '#FFF',
    lineHeight: 22,
    opacity: 0.9,
  },
});