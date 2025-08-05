import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/AuthProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const PAWN_CATEGORIES = {
  emoji: {
    title: 'Emoji Piyonlar',
    icon: '😊',
    items: [
      { id: 'emoji_1', emoji: '😀', name: 'Mutlu Yüz', price: 100, currency: 'points' },
      { id: 'emoji_2', emoji: '😎', name: 'Havalı', price: 150, currency: 'points' },
      { id: 'emoji_3', emoji: '🤩', name: 'Yıldız Gözlü', price: 200, currency: 'points' },
      { id: 'emoji_4', emoji: '🥳', name: 'Parti', price: 250, currency: 'points' },
      { id: 'emoji_5', emoji: '👑', name: 'Kral Tacı', price: 500, currency: 'points' },
      { id: 'emoji_6', emoji: '💎', name: 'Elmas', price: 2.99, currency: 'money' }
    ]
  },
  animals: {
    title: 'Hayvan Figürleri',
    icon: '🐾',
    items: [
      { id: 'animal_1', emoji: '🐱', name: 'Kedi', price: 120, currency: 'points' },
      { id: 'animal_2', emoji: '🐶', name: 'Köpek', price: 120, currency: 'points' },
      { id: 'animal_3', emoji: '🦁', name: 'Aslan', price: 300, currency: 'points' },
      { id: 'animal_4', emoji: '🐯', name: 'Kaplan', price: 350, currency: 'points' },
      { id: 'animal_5', emoji: '🦄', name: 'Unicorn', price: 4.99, currency: 'money' },
      { id: 'animal_6', emoji: '🐉', name: 'Ejder', price: 6.99, currency: 'money' }
    ]
  },
  nature: {
    title: 'Doğa Figürleri',
    icon: '🌿',
    items: [
      { id: 'nature_1', emoji: '🌸', name: 'Kiraz Çiçeği', price: 80, currency: 'points' },
      { id: 'nature_2', emoji: '🌺', name: 'Hibiskus', price: 100, currency: 'points' },
      { id: 'nature_3', emoji: '🌟', name: 'Yıldız', price: 180, currency: 'points' },
      { id: 'nature_4', emoji: '⚡', name: 'Şimşek', price: 220, currency: 'points' },
      { id: 'nature_5', emoji: '🔥', name: 'Ateş', price: 3.99, currency: 'money' },
      { id: 'nature_6', emoji: '❄️', name: 'Kar Tanesi', price: 3.99, currency: 'money' }
    ]
  }
};

const ShopScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('emoji');
  const [purchaseModal, setPurchaseModal] = useState({ visible: false, item: null });
  const [ownedPawns, setOwnedPawns] = useState(['default']); // Varsayılan piyon her zaman sahip olunan
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadOwnedPawns();
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
      })
    ]).start();
  }, []);

  const loadOwnedPawns = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/shop/pawns', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOwnedPawns(['default', ...data.ownedPawns]);
      }
    } catch (error) {
      console.error('Error loading owned pawns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (item) => {
    setPurchaseModal({ visible: true, item });
  };

  const confirmPurchase = async () => {
    const { item } = purchaseModal;
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Hata', 'Oturum açmanız gerekiyor.');
        return;
      }

      const response = await fetch('http://localhost:3001/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pawnId: item.id,
          price: item.price,
          currency: item.currency
        })
      });

      const data = await response.json();

      if (response.ok) {
        setOwnedPawns([...ownedPawns, item.id]);
        Alert.alert('Başarılı!', `${item.name} satın alındı!`);
        
        // Kullanıcının puanını güncelle (eğer puan ile satın aldıysa)
        if (item.currency === 'points' && data.newScore !== undefined) {
          // Burada user context'ini güncelleyebiliriz
        }
      } else {
        if (data.error === 'Insufficient points') {
          Alert.alert('Yetersiz Puan', 'Bu ürünü satın almak için yeterli puanınız yok.');
        } else if (data.error === 'Pawn already owned') {
          Alert.alert('Zaten Sahipsiniz', 'Bu piyona zaten sahipsiniz.');
        } else {
          Alert.alert('Hata', data.error || 'Satın alma işlemi başarısız.');
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Hata', 'Satın alma işlemi sırasında bir hata oluştu.');
    }
    
    setPurchaseModal({ visible: false, item: null });
  };

  const renderCategoryTabs = () => {
    return (
      <View style={styles.categoryTabs}>
        {Object.entries(PAWN_CATEGORIES).map(([key, category]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryTab,
              selectedCategory === key && styles.activeCategoryTab
            ]}
            onPress={() => setSelectedCategory(key)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryText,
              selectedCategory === key && styles.activeCategoryText
            ]}>
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPawnItem = (item) => {
    const isOwned = ownedPawns.includes(item.id);
    const canAfford = item.currency === 'points' ? (user?.score || 0) >= item.price : true;
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.pawnItem,
          isOwned && styles.ownedPawnItem,
          !canAfford && !isOwned && styles.unaffordablePawnItem
        ]}
        onPress={() => !isOwned && handlePurchase(item)}
        disabled={isOwned}
      >
        <View style={styles.pawnEmojiContainer}>
          <Text style={styles.pawnEmoji}>{item.emoji}</Text>
          {isOwned && (
            <View style={styles.ownedBadge}>
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          )}
        </View>
        
        <Text style={styles.pawnName}>{item.name}</Text>
        
        <View style={styles.priceContainer}>
          {item.currency === 'points' ? (
            <>
              <Ionicons name="trophy" size={16} color="#FFD700" />
              <Text style={[
                styles.priceText,
                !canAfford && !isOwned && styles.unaffordablePrice
              ]}>
                {item.price}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="card" size={16} color="#4CAF50" />
              <Text style={styles.priceText}>${item.price}</Text>
            </>
          )}
        </View>
        
        {isOwned ? (
          <View style={styles.ownedButton}>
            <Text style={styles.ownedButtonText}>Sahip</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.buyButton,
              !canAfford && styles.disabledBuyButton
            ]}
            onPress={() => handlePurchase(item)}
            disabled={!canAfford}
          >
            <Text style={[
              styles.buyButtonText,
              !canAfford && styles.disabledBuyButtonText
            ]}>
              {canAfford ? 'Satın Al' : 'Yetersiz'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground 
      source={require('../../assets/images/wood-background.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
        style={styles.gradient}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {renderCategoryTabs()}

        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim }
          ]}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pawnGrid}>
              {PAWN_CATEGORIES[selectedCategory].items.map(renderPawnItem)}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Satın Alma Modal */}
        <Modal
          visible={purchaseModal.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPurchaseModal({ visible: false, item: null })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {purchaseModal.item && (
                <>
                  <Text style={styles.modalEmoji}>{purchaseModal.item.emoji}</Text>
                  <Text style={styles.modalTitle}>{purchaseModal.item.name}</Text>
                  
                  <View style={styles.modalPriceContainer}>
                    {purchaseModal.item.currency === 'points' ? (
                      <>
                        <Ionicons name="trophy" size={24} color="#FFD700" />
                        <Text style={styles.modalPrice}>{purchaseModal.item.price} Puan</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="card" size={24} color="#4CAF50" />
                        <Text style={styles.modalPrice}>${purchaseModal.item.price}</Text>
                      </>
                    )}
                  </View>
                  
                  <Text style={styles.modalDescription}>
                    Bu piyonu satın almak istediğinizden emin misiniz?
                  </Text>
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={styles.modalCancelButton}
                      onPress={() => setPurchaseModal({ visible: false, item: null })}
                    >
                      <Text style={styles.modalCancelText}>İptal</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.modalConfirmButton}
                      onPress={confirmPurchase}
                    >
                      <Text style={styles.modalConfirmText}>Satın Al</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 120,
    marginBottom: 20,
  },
  categoryTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    marginHorizontal: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeCategoryTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  categoryText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  activeCategoryText: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  pawnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  pawnItem: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ownedPawnItem: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  unaffordablePawnItem: {
    opacity: 0.5,
  },
  pawnEmojiContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  pawnEmoji: {
    fontSize: 40,
  },
  ownedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawnName: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    marginLeft: 5,
  },
  unaffordablePrice: {
    color: '#FF6B6B',
  },
  buyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledBuyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buyButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  disabledBuyButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  ownedButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ownedButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width * 0.8,
  },
  modalEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginBottom: 15,
  },
  modalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalPrice: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginLeft: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    fontFamily: 'Poppins_400Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalConfirmText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default ShopScreen;