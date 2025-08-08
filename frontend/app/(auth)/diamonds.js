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
import { DiamondService } from '../../services/DiamondService';
import { PurchaseService } from '../../services/PurchaseService';

const { width } = Dimensions.get('window');

export default function DiamondsScreen() {
  const [diamonds, setDiamonds] = useState(0);
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
    loadData();
    initializePurchases();
  }, []);

  const loadData = async () => {
    try {
      const diamondCount = await DiamondService.getDiamonds();
      setDiamonds(diamondCount);
    } catch (error) {
      console.error('Error loading diamonds:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializePurchases = async () => {
    try {
      const result = await PurchaseService.initializePurchases();
      
      if (result.success) {
        setProducts(result.products);
        setDiamondPackages(result.diamondPackages);
      } else {
        console.error('Purchase initialization failed:', result.error);
      }
    } catch (error) {
      console.error('Error initializing purchases:', error);
    }
  };

  const handleBuyDiamonds = async (packageInfo) => {
    try {
      setPurchaseLoading(true);
      
      const result = await PurchaseService.buyProduct(packageInfo.productId);
      
      if (result.success) {
        // Elmas sayısını güncelle
        await DiamondService.addDiamonds(packageInfo.diamonds);
        await loadData();
        
        showModal('Satın Alma Başarılı!', `${packageInfo.diamonds} elmas hesabınıza eklendi.`);
      } else {
        showModal('Satın Alma Başarısız', result.error || 'Bilinmeyen bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error buying diamonds:', error);
      showModal('Hata', 'Satın alma sırasında bir hata oluştu.');
    } finally {
      setPurchaseLoading(false);
    }
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
          <Text style={styles.headerTitle}>Elmas Satın Al</Text>
          <View style={styles.diamondHeader}>
            <Ionicons name="diamond" size={20} color="#FFD700" />
            <Text style={styles.diamondCount}>{diamonds}</Text>
          </View>
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

      {/* Loading Overlay */}
      {purchaseLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>İşlem yapılıyor...</Text>
        </View>
      )}

      {/* Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>
            
            <View style={styles.modalButtonContainer}>
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
            </View>
          </View>
        </View>
      </Modal>
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
  section: {
    margin: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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