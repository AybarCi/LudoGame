import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EnergyService } from '../../services/EnergyService';
import { DiamondService } from '../../services/DiamondService';
import { PurchaseService } from '../../services/PurchaseService';
import { AdService } from '../../services/AdService';

const { width } = Dimensions.get('window');

export default function EnergyScreen() {
  const [energy, setEnergy] = useState(0);
  const [maxEnergy, setMaxEnergy] = useState(5);
  const [diamonds, setDiamonds] = useState(0);
  const [timeUntilNextEnergy, setTimeUntilNextEnergy] = useState('');
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [diamondPackages, setDiamondPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', buttons: [] });

  const showModal = (title, message, buttons = null) => {
    setModalConfig({ title, message, buttons });
    setModalVisible(true);
  };

  useEffect(() => {
    // Enerji sistemini başlat
    EnergyService.initializeEnergySystem().then(() => {
      loadData();
    });
    initializePurchases();
    
    // Her saniye enerji durumunu güncelle
    const interval = setInterval(() => {
      updateEnergyStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Debug enerji durumu
      await EnergyService.debugEnergyStatus();
      
      const [energyData, diamondData] = await Promise.all([
        EnergyService.getEnergyInfo(),
        DiamondService.getDiamonds()
      ]);
      
      setEnergy(energyData.current);
      setMaxEnergy(energyData.max);
      setDiamonds(diamondData);
      
      updateTimeUntilNext();
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

  const updateTimeUntilNext = async () => {
    try {
      const timeLeft = await EnergyService.getTimeUntilNextEnergy();
      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        setTimeUntilNextEnergy(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeUntilNextEnergy('');
      }
    } catch (error) {
      console.error('Error calculating time until next energy:', error);
    }
  };

  const handleBuyEnergyWithDiamonds = async () => {
    try {
      // Enerji zaten tam doluysa satın alma işlemini engelle
      if (energy >= maxEnergy) {
        showModal('Enerji Tam Dolu', 'Enerjiniz zaten tam dolu. Satın alma yapmanıza gerek yok.');
        return;
      }

      if (diamonds < 50) {
        showModal('Yetersiz Elmas', 'Enerji satın almak için 50 elmasınız olmalı.');
        return;
      }

      showModal(
        'Enerji Satın Al',
        '50 elmas karşılığında enerjinizi tam doldurmak istiyor musunuz?',
        [
          { text: 'İptal', onPress: () => setModalVisible(false) },
          {
            text: 'Satın Al',
            onPress: async () => {
              setModalVisible(false);
              try {
                setPurchaseLoading(true);
                const success = await EnergyService.buyEnergyWithDiamonds();
                
                if (success) {
                  await loadData();
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
      
      // Reklam göster
      await AdService.showRewardedAd();
      
      // Reklam izlendikten sonra 1 enerji ver
      const success = await EnergyService.addEnergy(1);
      
      if (success) {
        await loadData();
        showModal('Tebrikler!', '1 enerji kazandınız!');
      } else {
        showModal('Hata', 'Enerji ekleme işlemi başarısız oldu.');
      }
    } catch (error) {
      console.error('Error watching ad for energy:', error);
      showModal('Hata', 'Reklam izleme sırasında bir hata oluştu.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const renderEnergyBar = () => {
    const energyPercentage = (energy / maxEnergy) * 100;
    
    return (
      <View style={styles.energyContainer}>
        <View style={styles.energyHeader}>
          <Ionicons name="flash" size={24} color="#FFD700" />
          <Text style={styles.energyTitle}>Enerji</Text>
          <Text style={styles.energyCount}>{energy}/{maxEnergy}</Text>
        </View>
        
        <View style={styles.energyBarContainer}>
          <View style={styles.energyBarBackground}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={[styles.energyBarFill, { width: `${energyPercentage}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
        
        {energy < maxEnergy && timeUntilNextEnergy && (
          <Text style={styles.nextEnergyText}>
            Sonraki enerji: {timeUntilNextEnergy}
          </Text>
        )}
      </View>
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
          colors={['#4A90E2', '#357ABD']}
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
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enerji & Elmas</Text>
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
                colors={diamonds >= 50 ? ['#FFD700', '#FFA500'] : ['#666', '#444']}
                style={styles.energyOptionGradient}
              >
                <View style={styles.energyOptionContent}>
                  <Ionicons name="flash" size={24} color="white" />
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
                colors={['#4CAF50', '#45a049']}
                style={styles.energyOptionGradient}
              >
                <View style={styles.energyOptionContent}>
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <View style={styles.energyOptionText}>
                    <Text style={styles.energyOptionTitle}>Enerji Tam Dolu</Text>
                    <Text style={styles.energyOptionSubtitle}>Satın alma gerekmiyor</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Reklam İzleyerek Enerji Al - Sadece enerji tam değilse göster */}
          {energy < maxEnergy && (
            <TouchableOpacity
              style={styles.energyOption}
              onPress={handleWatchAdForEnergy}
              disabled={purchaseLoading}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.energyOptionGradient}
              >
                <View style={styles.energyOptionContent}>
                  <Ionicons name="play-circle" size={24} color="white" />
                  <View style={styles.energyOptionText}>
                    <Text style={styles.energyOptionTitle}>Reklam İzle</Text>
                    <Text style={styles.energyOptionSubtitle}>+1 Enerji</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Elmas Paketleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elmas Paketleri</Text>
          <View style={styles.packagesGrid}>
            {diamondPackages.map((packageInfo, index) => 
              renderDiamondPackage(packageInfo, index)
            )}
          </View>
        </View>

        {/* Satın Almaları Geri Yükle */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={async () => {
            try {
              setPurchaseLoading(true);
              const result = await PurchaseService.restorePurchases();
              
              if (result.success) {
                await loadData();
                showModal('Başarılı', `${result.restoredCount} satın alma geri yüklendi.`);
              } else {
                showModal('Hata', result.error);
              }
            } catch (error) {
              showModal('Hata', 'Geri yükleme sırasında bir hata oluştu.');
            } finally {
              setPurchaseLoading(false);
            }
          }}
          disabled={purchaseLoading}
        >
          <Text style={styles.restoreButtonText}>Satın Almaları Geri Yükle</Text>
        </TouchableOpacity>


      </ScrollView>

      {/* Custom Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
           <LinearGradient
             colors={['#1e1e2e', '#2a2a3e', '#1e1e2e']}
             style={styles.modalContainer}
           >
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            <View style={styles.modalButtonContainer}>
              {modalConfig.buttons ? (
                modalConfig.buttons.map((button, index) => (
                   <TouchableOpacity
                     key={index}
                     style={styles.modalButton}
                     onPress={button.onPress}
                   >
                     <LinearGradient
                       colors={index === 0 ? ['#666', '#555'] : ['#4A90E2', '#357ABD']}
                       style={[
                         styles.modalButtonGradient,
                         index === 0 ? styles.modalButtonSecondary : styles.modalButtonPrimary
                       ]}
                     >
                       <Text style={[
                         styles.modalButtonText,
                         index === 0 ? styles.modalButtonTextSecondary : styles.modalButtonTextPrimary
                       ]}>{button.text}</Text>
                     </LinearGradient>
                   </TouchableOpacity>
                 ))
              ) : (
                <TouchableOpacity
                   style={styles.modalButton}
                   onPress={() => setModalVisible(false)}
                 >
                   <LinearGradient
                     colors={['#4A90E2', '#357ABD']}
                     style={[styles.modalButtonGradient, styles.modalButtonPrimary]}
                   >
                     <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Tamam</Text>
                   </LinearGradient>
                 </TouchableOpacity>
              )}
             </View>
           </LinearGradient>
         </View>
       </Modal>

      {/* Loading Overlay */}
      {purchaseLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90E2" />
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
    backgroundColor: '#1a1a2e',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#FFD700',
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
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  energyOptionGradient: {
    padding: 15,
  },
  energyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  energyOptionText: {
    marginLeft: 15,
  },
  energyOptionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  energyOptionSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
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
    color: '#FFD700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1e1e2e',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    maxWidth: 320,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  modalButton: {
     borderRadius: 12,
     flex: 1,
     marginHorizontal: 5,
     overflow: 'hidden',
   },
   modalButtonGradient: {
     paddingVertical: 14,
     paddingHorizontal: 25,
     borderRadius: 12,
   },
   modalButtonPrimary: {
     // Gradient ile uygulanacak
   },
   modalButtonSecondary: {
     borderWidth: 1,
     borderColor: '#666',
   },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalButtonTextPrimary: {
    color: 'white',
  },
  modalButtonTextSecondary: {
    color: '#ccc',
  },
});