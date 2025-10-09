import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../store/slices/alertSlice';
import { EnergyService } from '../../services/EnergyService';
import useEnergy from '../../hooks/useEnergy';
import { DiamondService } from '../../services/DiamondService';
import { PurchaseService } from '../../services/PurchaseService';
import { AdService } from '../../services/AdService';

const { width } = Dimensions.get('window');

export default function EnergyScreen() {
  const { energy, maxEnergy, timeUntilNext: timeUntilNextEnergy, loadEnergy, buyEnergy } = useEnergy();
  const [diamonds, setDiamonds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [diamondPackages, setDiamondPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const dispatch = useDispatch();

  // Animasyon değişkenleri
  const energyAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const showModal = (title, message) => {
    dispatch(showAlert({ title, message, type: 'info' }));
  };

  // Enerji kazanma animasyonu
  const animateEnergyGain = () => {
    Animated.sequence([
      Animated.timing(energyAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(energyAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Buton basma animasyonu
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    // Enerji sistemini başlat
    EnergyService.initializeEnergySystem().then(() => {
      loadData();
    });
    initializePurchases();
  }, []);

  const loadData = async () => {
    try {
      await loadEnergy();
      
      const diamondCount = await DiamondService.getDiamonds();
      setDiamonds(diamondCount);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializePurchases = async () => {
    try {
      const initialized = await PurchaseService.initialize();
      if (initialized) {
        const [packages, productList] = await Promise.all([
          PurchaseService.getDiamondPackages(),
          PurchaseService.loadProducts()
        ]);
        
        setDiamondPackages(Object.values(packages));
        setProducts(productList);
        
        // Bekleyen satın almaları kontrol et
        await PurchaseService.checkPendingPurchases();
      }
    } catch (error) {
      console.error('Error initializing purchases:', error);
    }
  };

  const updateEnergyStatus = async () => {
    try {
      const energyData = await EnergyService.getEnergyInfo();
      setEnergy(energyData.current);
      updateTimeUntilNext();
    } catch (error) {
      console.error('Error updating energy status:', error);
    }
  };

  // Zaman güncelleme artık hook'ta yönetiliyor

  const handleBuyEnergyWithDiamonds = async () => {
    try {
      // Enerji zaten tam doluysa satın alma işlemini engelle
      if (energy >= maxEnergy) {
        showModal('Enerji Tam Dolu', 'Enerjiniz zaten tam dolu. Satın alma yapmanıza gerek yok.');
        return;
      }

      if (diamonds < 50) {
        Alert.alert(
          'Yetersiz Elmas', 
          'Enerji satın almak için 50 elmasınız olmalı. Elmas satın almak istiyor musunuz?',
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Elmas Al',
              onPress: () => {
                router.push('/(auth)/diamonds');
              }
            }
          ]
        );
        return;
      }

      Alert.alert(
        'Enerji Satın Al',
        '50 elmas karşılığında enerjinizi tam doldurmak istiyor musunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Satın Al',
            onPress: async () => {
              try {
                setPurchaseLoading(true);
                const success = await buyEnergy();
                
                if (success) {
                  showModal('Başarılı', 'Enerjiniz tam dolduruldu!');
                } else {
                  showModal('Hata', 'Enerji satın alma işlemi başarısız oldu.');
                }
              } catch (error) {
                console.error('Error buying energy:', error);
                showModal('Hata', 'Bir hata oluştu.');
              } finally {
                setPurchaseLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in buy energy process:', error);
    }
  };

  const handleBuyDiamonds = async (packageInfo) => {
    try {
      setPurchaseLoading(true);
      
      const result = await PurchaseService.purchaseProduct(packageInfo.productId);
      
      if (result.success) {
        await loadData();
        showModal('Başarılı', `${packageInfo.diamonds} elmas hesabınıza eklendi!`);
      } else {
        if (result.error !== 'Satın alma iptal edildi') {
          showModal('Hata', result.error || 'Satın alma işlemi başarısız oldu.');
        }
      }
    } catch (error) {
      console.error('Error buying diamonds:', error);
      showModal('Hata', 'Satın alma sırasında bir hata oluştu.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleWatchAdForEnergy = async () => {
    try {
      // Enerji zaten tam doluysa reklam izlemeyi engelle
      if (energy >= maxEnergy) {
        showModal('Enerji Tam Dolu', 'Enerjiniz zaten tam dolu. Reklam izlemenize gerek yok.');
        return;
      }

      setPurchaseLoading(true);
      animateButtonPress();
      
      // Reklam göster ve kullanıcının reklamı izleyip izlemediğini kontrol et
      const adResult = await AdService.showRewardedAd();
      
      // Sadece reklam tamamen izlendiyse enerji ver
      if (adResult.userDidWatchAd) {
        // Reklam başarıyla izlendi
        animateEnergyGain();
        const success = await EnergyService.addEnergy(1);
        
        if (success) {
          await loadData();
          showModal('Tebrikler!', '1 enerji kazandınız!');
        } else {
          showModal('Hata', 'Enerji ekleme işlemi başarısız oldu.');
        }
      } else {
        // Reklam izlenmediyse bilgi mesajı göster
        showModal('Bilgi', 'Reklam izleme tamamlanmadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error watching ad for energy:', error);
      showModal('Bilgi', 'Reklam şu anda mevcut değil. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const renderEnergyBar = () => {
    const energyPercentage = energy && maxEnergy ? (energy / maxEnergy) * 100 : 0;
    
    return (<Animated.View style={[styles.energyContainer, { transform: [{ scale: energyAnim }] }]}>
        <View style={styles.energyHeader}>
          <Ionicons name="flash" size={24} color="#FFD700" />
          <Text style={styles.energyTitle}>Enerji</Text>
          <Text style={styles.energyCount}>{energy || 0}/{maxEnergy || 5}</Text>
        </View>
        
        <View style={styles.energyBarContainer}>
          <View style={styles.energyBarBackground}>
            <LinearGradient
              colors={['#00D9CC', '#00B8A6']}
              style={[styles.energyBarFill, { width: `${energyPercentage}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
        
        {energy < maxEnergy && timeUntilNextEnergy > 0 && (
          <Text style={styles.nextEnergyText}>
            Sonraki enerji: {Math.floor(timeUntilNextEnergy / 60000)}:{Math.floor((timeUntilNextEnergy % 60000) / 1000).toString().padStart(2, '0')}
          </Text>
        )}
        </Animated.View>      
      
    );
  };

  const renderDiamondPackage = (packageInfo, index) => {
    const product = products.find(p => p.productId === packageInfo.productId);
    const price = product ? product.price : packageInfo.price;
    
    return (
      <TouchableOpacity
        key={index}
        style={styles.packageCard}
        onPress={() => handleBuyDiamonds(packageInfo)}
        disabled={purchaseLoading}
      >
        <LinearGradient
          colors={['#6E00B3', '#4A0080']}
          style={styles.packageGradient}
        >
          <Ionicons name="diamond" size={32} color="#FFD700" />
          <Text style={styles.packageTitle}>{packageInfo.title}</Text>
          <Text style={styles.packageDiamonds}>{packageInfo.diamonds} Elmas</Text>
          <Text style={styles.packagePrice}>{price}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D9CC" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#6E00B3', '#4A0080']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enerji</Text>
          <View style={styles.diamondHeader}>
            <Ionicons name="diamond" size={20} color="#FFD700" />
            <Text style={styles.diamondCount}>{diamonds}</Text>
          </View>
        </View>

        {/* Enerji Durumu */}
        {renderEnergyBar()}

        {/* Enerji Satın Alma Seçenekleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enerji Al</Text>
          
          {/* Elmasla Enerji Al - Sadece enerji tam değilse göster */}
          {energy < maxEnergy && (
            <TouchableOpacity
              style={styles.energyOption}
              onPress={handleBuyEnergyWithDiamonds}
              disabled={purchaseLoading || diamonds < 50}
            >
              <LinearGradient
                colors={diamonds >= 50 ? ['#00D9CC', '#00B8A6'] : ['#666', '#444']}
                style={styles.energyOptionGradient}
              >
                <View style={styles.energyOptionContent}>
                  <Ionicons name="flash" size={36} color="white" />
                  <View style={styles.energyOptionText}>
                    <Text style={styles.energyOptionTitle}>Tam Enerji</Text>
                    <Text style={styles.energyOptionSubtitle}>50 Elmas</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Enerji tam doluysa bilgi mesajı göster */}
          {energy >= maxEnergy && (
            <View style={[styles.energyOption, { opacity: 0.6 }]}>
              <LinearGradient
                colors={['#E61A8D', '#C71585']}
                style={styles.energyOptionGradient}
              >
                <View style={styles.energyOptionContent}>
                  <Ionicons name="checkmark-circle" size={36} color="white" />
                  <View style={styles.energyOptionText}>
                    <Text style={styles.energyOptionTitle}>Enerji Tam Dolu</Text>
                    <Text style={styles.energyOptionSubtitle}>Satın alma gerekmiyor</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Reklam İzle Butonu - Modern Tasarım */}
          {energy < maxEnergy && (
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity
                style={styles.energyOption}
                onPress={handleWatchAdForEnergy}
                disabled={purchaseLoading}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.energyOptionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.energyOptionContent}>
                    <Ionicons name="play-circle" size={36} color="white" />
                    <View style={styles.energyOptionText}>
                      <Text style={styles.energyOptionTitle}>Reklam İzle</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={[styles.energyOptionSubtitle, { marginRight: 4 }]}>+1</Text>
                        <Ionicons name="flash" size={16} color="#FFD700" />
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>






      </ScrollView>

      {/* Loading Overlay */}
      {purchaseLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00D9CC" />
          <Text style={styles.loadingText}>İşlem yapılıyor...</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6E00B3',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  diamondHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diamondCount: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  energyContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(0, 217, 204, 0.1)',
    borderRadius: 15,
  },
  energyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  energyTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  energyCount: {
    color: '#00D9CC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  energyBarContainer: {
    marginBottom: 10,
  },
  energyBarBackground: {
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  nextEnergyText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  energyOption: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  energyOptionGradient: {
    padding: 25,
    minHeight: 100,
    justifyContent: 'center',
  },
  energyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyOptionText: {
    marginLeft: 20,
    flex: 1,
  },
  energyOptionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  energyOptionSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    marginTop: 4,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  packageCard: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  packageGradient: {
    padding: 15,
    alignItems: 'center',
  },
  packageTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  packageDiamonds: {
    color: '#00D9CC',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  packagePrice: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
  restoreButton: {
    margin: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: 'white',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});