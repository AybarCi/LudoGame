// ShopModal.js - Mağaza modalı bileşeni
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DiamondService } from '../../services/DiamondService';
import CustomModal from './CustomModal';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

const ShopModal = ({ visible, onClose }) => {
  const [diamonds, setDiamonds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [customModal, setCustomModal] = useState({ visible: false, title: '', message: '', type: 'info', buttons: [] });

  useEffect(() => {
    if (visible) {
      loadDiamonds();
    }
  }, [visible]);

  const loadDiamonds = async () => {
    const currentDiamonds = await DiamondService.getDiamonds();
    setDiamonds(currentDiamonds);
  };

  const shopItems = [
    {
      id: 'diamonds_100',
      type: 'diamonds',
      amount: 100,
      price: '$0.99',
      popular: false,
      icon: 'diamond',
      color: '#9C27B0'
    },
    {
      id: 'diamonds_500',
      type: 'diamonds',
      amount: 500,
      price: '$4.99',
      popular: true,
      icon: 'diamond',
      color: '#9C27B0'
    },
    {
      id: 'diamonds_1000',
      type: 'diamonds',
      amount: 1000,
      price: '$9.99',
      popular: false,
      icon: 'diamond',
      color: '#9C27B0'
    },
    {
      id: 'remove_ads',
      type: 'feature',
      title: 'Reklamları Kaldır',
      description: 'Tüm reklamları kalıcı olarak kaldır',
      price: '$2.99',
      popular: false,
      icon: 'ban',
      color: '#FF6B35'
    },
    {
      id: 'premium_themes',
      type: 'feature',
      title: 'Premium Temalar',
      description: 'Özel tema paketlerine erişim',
      price: '$1.99',
      popular: false,
      icon: 'color-palette',
      color: '#9C27B0'
    }
  ];

  const handlePurchase = async (item) => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      if (item.type === 'diamonds') {
        // Gerçek uygulamada burada ödeme işlemi yapılacak
        setCustomModal({
          visible: true,
          title: 'Satın Alma',
          message: `${item.amount} elmas satın almak için ${item.price} ödeme yapılacak.\n\nBu demo sürümünde ödeme simüle edilecek.`,
          type: 'info',
          buttons: [
            {
              text: 'İptal',
              style: 'cancel',
              onPress: () => setCustomModal({ visible: false, title: '', message: '', type: 'info', buttons: [] })
            },
            {
              text: 'Satın Al',
              style: 'default',
              onPress: async () => {
                setCustomModal({ visible: false, title: '', message: '', type: 'info', buttons: [] });
                // Demo için elmasları ekle
                await DiamondService.addDiamonds(item.amount);
                await loadDiamonds();
                setCustomModal({
                  visible: true,
                  title: 'Başarılı!',
                  message: `${item.amount} elmas hesabınıza eklendi!`,
                  type: 'success',
                  buttons: []
                });
              }
            }
          ]
        });
      } else {
        setCustomModal({
          visible: true,
          title: 'Satın Alma',
          message: `${item.title} özelliği ${item.price} karşılığında satın alınacak.\n\nBu demo sürümünde ödeme simüle edilecek.`,
          type: 'info',
          buttons: [
            {
              text: 'İptal',
              style: 'cancel',
              onPress: () => setCustomModal({ visible: false, title: '', message: '', type: 'info', buttons: [] })
            },
            {
              text: 'Satın Al',
              style: 'default',
              onPress: () => {
                setCustomModal({
                  visible: true,
                  title: 'Başarılı!',
                  message: `${item.title} özelliği aktifleştirildi!`,
                  type: 'success',
                  buttons: []
                });
              }
            }
          ]
        });
      }
    } catch (error) {
      setCustomModal({
        visible: true,
        title: 'Hata',
        message: 'Satın alma işlemi başarısız oldu.',
        type: 'error',
        buttons: []
      });
    } finally {
      setLoading(false);
    }
  };

  const renderShopItem = (item) => {
    return (
      <View key={item.id} style={styles.itemContainer}>
        {item.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>POPÜLER</Text>
          </View>
        )}
        
        <LinearGradient
          colors={['#FFFFFF', '#F5F5F5']}
          style={styles.itemGradient}
        >
          <View style={styles.itemHeader}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            
            {item.type === 'diamonds' ? (
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.amount} Elmas</Text>
                <Text style={styles.itemDescription}>Oyun içi para birimi</Text>
              </View>
            ) : (
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.itemFooter}>
            <Text style={styles.priceText}>{item.price}</Text>
            <TouchableOpacity
              style={[styles.buyButton, { backgroundColor: item.color }]}
              onPress={() => handlePurchase(item)}
              disabled={loading}
            >
              <Text style={styles.buyButtonText}>Satın Al</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="storefront" size={24} color="#FFF" />
                <Text style={styles.headerTitle}>Mağaza</Text>
              </View>
              
              <View style={styles.headerRight}>
                <View style={styles.diamondDisplay}>
                  <Ionicons name="diamond" size={16} color="#9C27B0" />
                  <Text style={styles.diamondCount}>{diamonds}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Elmas Paketleri</Text>
              {shopItems.filter(item => item.type === 'diamonds').map(renderShopItem)}
              
              <Text style={styles.sectionTitle}>Premium Özellikler</Text>
              {shopItems.filter(item => item.type === 'feature').map(renderShopItem)}
              
              <View style={styles.bottomPadding} />
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
      
      {/* Custom Modal */}
      <CustomModal
        visible={customModal.visible}
        title={customModal.title}
        message={customModal.message}
        type={customModal.type}
        buttons={customModal.buttons}
        onClose={() => setCustomModal({ visible: false, title: '', message: '', type: 'info', buttons: [] })}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    height: height * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  diamondDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  diamondCount: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
    marginTop: 10,
  },
  itemContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  popularText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemGradient: {
    borderRadius: 15,
    padding: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  buyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomPadding: {
    height: 20,
  },
});

export default ShopModal;