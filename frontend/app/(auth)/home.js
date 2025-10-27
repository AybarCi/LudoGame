import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Animated, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Text } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
 
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeButtons from '../../components/modules/HomeButtons';
import RotatingStatsCard from '../../components/modules/RotatingStatsCard';
import LogoutModal from '../../components/LogoutModal';
import { DiamondService } from '../../services/DiamondService';
import { EnergyService } from '../../services/EnergyService';
import useEnergy from '../../hooks/useEnergy';
import { API_BASE_URL } from '../../constants/game';
import { usePawns } from '../../hooks/useApi';


const { width } = Dimensions.get('window');


const HomeScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  
  // Extract actual user object if it's wrapped in success property
  const actualUser = user?.success && user?.user ? user.user : user;
  const diamonds = useSelector(state => state.diamonds?.count || 0);
  const ownedPawnCount = useSelector(state => Array.isArray(state.api?.ownedPawns) ? state.api.ownedPawns.filter(id => id !== 'default').length : 0);
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { energy, maxEnergy, loadEnergy, hasEnoughEnergy, useEnergy: useEnergyFunc, buyEnergy } = useEnergy();
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  const [currentNickname, setCurrentNickname] = useState(actualUser?.nickname || '');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  // Load owned pawns and selected pawn into Redux on Home mount
  usePawns();

  useEffect(() => {
    // Enerji sistemini başlat
    EnergyService.initializeEnergySystem().then(() => {
      loadEnergy();
      loadUserAvatar();
    });
    
    // Set up energy refresh interval
    const energyInterval = setInterval(() => {
      loadEnergy();
    }, 60000); // Update every minute

    return () => clearInterval(energyInterval);
  }, []);

  // Elmas değerini senkronize et
  useEffect(() => {
    const syncDiamonds = async () => {
      try {
        const diamondsFromStorage = await DiamondService.getDiamonds();
        // Redux store'daki değer ile senkronizasyon
        // Bu fonksiyon Redux store'u güncelleyecek
      } catch (error) {
        console.error('Elmas senkronizasyon hatası:', error);
      }
    };
    syncDiamonds();
  }, []);
  
  // Açılış animasyonları
  useEffect(() => {
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered button animations
    buttonAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 200 + (index * 150),
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, slideAnim, scaleAnim, buttonAnims]);

  // actualUser değiştiğinde currentNickname'i güncelle
  useEffect(() => {
    if (actualUser?.nickname) {
      setCurrentNickname(actualUser.nickname);
    }
  }, [actualUser?.nickname]);

  // Redux store'daki user objesi değiştiğinde currentNickname'i güncelle
  useEffect(() => {
    if (user?.nickname) {
      setCurrentNickname(user.nickname);
    } else if (user?.user?.nickname) {
      setCurrentNickname(user.user.nickname);
    }
  }, [user]);



  // Elmas değeri artık Redux store'dan geliyor, bu yüzden bu fonksiyon kaldırıldı

  // Artık useEnergy hook'undan geliyor
  // const loadEnergy = async () => {
  //   try {
  //     const energyInfo = await EnergyService.getEnergyInfo();
  //     setEnergy({
  //       current: energyInfo.current,
  //       max: energyInfo.max,
  //       timeUntilNext: energyInfo.timeUntilNext
  //     });
  //   } catch (error) {
  //     console.error('Error loading energy:', error);
  //   }
  // };

  const handlePlayWithAI = async () => {
    setLoading(true);
    
    try {
      // AI modu için enerji kullanımı yok - serbest mod
      const playerNickname = currentNickname || 'Oyuncu 1';
      const playersInfo = {
        red: { nickname: playerNickname, type: 'human' },
        green: { nickname: 'Cansu', type: 'ai' },
        yellow: { nickname: 'Cenk Acar', type: 'ai' },
        blue: { nickname: 'Cihan', type: 'ai' },
      };

      router.push({
        pathname: '/game',
        params: {
          mode: 'ai',
          playersInfo: JSON.stringify(playersInfo),
          playerColor: 'red',
        },
      });
    } catch (error) {
      console.error('AI game start failed:', error);
      setLoading(false);
      Alert.alert('Hata', 'AI oyunu başlatılırken bir hata oluştu.');
    }
  };

  const handlePlayOnline = () => {
    router.push('/(auth)/lobby');
  };

  const handleShop = () => {
    router.push('/(auth)/shop');
  };

  const handleFreeMode = () => {
    router.push('/(auth)/freemode');
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    setLogoutLoading(true);
    try {
      // Avatar cache'ini temizle
      await AsyncStorage.removeItem('userAvatarUrl');
      await dispatch(logout());
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const loadUserAvatar = async () => {
    if (actualUser?.id) {
      try {
        // Önce AsyncStorage'dan cache'lenmiş avatarı dene
        const cachedAvatar = await AsyncStorage.getItem('userAvatarUrl');
        if (cachedAvatar) {
          console.log('Cache avatar bulundu, hemen gösteriliyor');
          // Normalize cached avatar URL de (eski base hatalı olabilir)
          const normalizedCached = normalizeAvatarUrl(cachedAvatar);
          setAvatarUrl(normalizedCached);
        }

        // Get authentication token
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.log('No authentication token available for avatar loading');
          return;
        }

        console.log('Loading avatar from:', `${API_BASE_URL}/api/avatar/${actualUser.id}`);
        const response = await fetch(`${API_BASE_URL}/api/avatar/${actualUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('Avatar response status:', response.status);
        const data = await response.json();
        console.log('Avatar response data:', data);
        
        // API'dan gelen avatarUrl'yi kontrol et
        if (data.success) {
          if (data.avatarUrl) {
            const normalized = normalizeAvatarUrl(data.avatarUrl);
            const busted = withCacheBust(normalized);
            console.log('Avatar URL bulundu (normalized):', normalized);
            setAvatarUrl(busted);
            // Güncel avatarı cache'e (cache-bust olmadan) kaydet
            await AsyncStorage.setItem('userAvatarUrl', normalized);
          } else {
            console.log('Avatar URL null, kullanıcının avatarı yok');
            // Avatar yoksa state'i temizle (varsayılan ikon gösterilecek)
            setAvatarUrl(null);
            // Cache'i de temizle
            await AsyncStorage.removeItem('userAvatarUrl');
          }
        } else {
          console.log('Avatar API başarısız:', data.message);
          // API başarısız olursa cache'i koru ama yeni bir şey yükleme
        }
      } catch (error) {
        console.error('Avatar yüklenirken hata:', error);
        console.error('API URL:', `${API_BASE_URL}/api/avatar/${actualUser.id}`);
        // Hata durumunda cache'lenmiş avatarı kullanmaya devam et
      }
    }
  };

  // Avatar URL normalize helper
  const normalizeAvatarUrl = (url) => {
    if (!url) return null;
    try {
      if (url.startsWith('/uploads')) {
        return `${API_BASE_URL}${url}`;
      }
      const baseRegex = /^https?:\/\/[^/]+/;
      const apiBase = API_BASE_URL.replace(/\/$/, '');
      return url.replace(baseRegex, apiBase);
    } catch (e) {
      return url;
    }
  };

  // Görsel cache'ini kırmak için yardımcı
  const withCacheBust = (url) => {
    if (!url) return url;
    try {
      if (url.startsWith('data:')) return url;
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}t=${Date.now()}`;
    } catch (e) {
      return url;
    }
  };

  // Store'daki avatarUrl güncellenirse ekranda tazele ve cache'i senkronize et
  useEffect(() => {
    const nextAvatar = (actualUser?.avatarUrl) || (user?.avatarUrl) || (user?.user?.avatarUrl);
    if (nextAvatar) {
      const normalized = normalizeAvatarUrl(nextAvatar);
      const busted = withCacheBust(normalized);
      setAvatarUrl(busted);
      // Cache'e normalized URL yaz (cache-bust olmadan)
      AsyncStorage.setItem('userAvatarUrl', normalized);
    }
  }, [actualUser?.avatarUrl, user]);

  

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#6E00B3', '#4A0080', '#1a1a2e']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View 
        style={[
          styles.topContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <View style={styles.headerContainer}>
          <View 
            style={styles.avatarContainer}
          >
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={40} color="#00D9CC" />
              )}
            </View>
            <View style={styles.avatarGlow} />
          </View>
          <Text style={styles.welcomeText}>Hoş Geldin!</Text>
          <Text style={styles.nicknameText}>{currentNickname || 'Misafir'}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <RotatingStatsCard
            stats={[
              {
                icon: 'flash',
                iconColor: '#FFD700',
                value: `${energy}/${maxEnergy}`,
                label: 'Enerji',
                gradient: ['#00D9CC', '#00B8A6'],
                valueColor: '#FFFFFF',
                onPress: () => router.push('/(auth)/energy')
              },
              {
                icon: 'diamond',
                iconColor: '#00D9CC',
                value: diamonds.toString(),
                label: 'Elmas',
                gradient: ['#FFD700', '#FFA000'],
                valueColor: '#FFFFFF',
                onPress: () => router.push('/(auth)/shop')
              },
              {
                icon: 'trophy',
                iconColor: '#FFD700',
                value: (actualUser?.score || 0).toString(),
                label: 'Puan',
                gradient: ['#6E00B3', '#4A0080'],
                valueColor: '#FFFFFF'
              },
              {
                icon: 'star',
                iconColor: '#FFD700',
                value: actualUser?.level?.toString() || '1',
                label: 'Seviye',
                gradient: ['#E61A8D', '#C71585'],
                valueColor: '#FFFFFF'
              },
              {
                icon: 'grid',
                iconColor: '#00D9CC',
                value: ownedPawnCount.toString(),
                label: 'Piyon Koleksiyonum',
                gradient: ['#2E8B57', '#006400'],
                valueColor: '#FFFFFF',
                onPress: () => router.push('/(auth)/pawnCollection')
              }
            ]}
          />
        </View>
      </Animated.View>

      {/* Profile Icon - Top Left */}
      <TouchableOpacity 
        style={styles.profileIcon}
        onPress={() => router.push('/(auth)/profile')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#00D9CC', '#00B3A6']}
          style={styles.profileIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="person" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Market Icon - Top Right */}
      <TouchableOpacity 
        style={styles.marketIcon}
        onPress={handleShop}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#6E00B3', '#4A0080']}
          style={styles.marketIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="storefront" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.bottomContainer}>
        <Animated.View 
          style={[
            styles.modeSelectionContainer,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.modeTitle}>Oyun Modu Seç</Text>
          
          <HomeButtons 
            fadeAnim={fadeAnim}
            buttonAnims={buttonAnims}
            handlePlayWithAI={handlePlayWithAI}
            handlePlayOnline={handlePlayOnline}
            handleFreeMode={handleFreeMode}
            handleShop={handleShop}
            loading={loading}
            showShopButton={false}
          />
        </Animated.View>
      </View>

      {/* Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#00D9CC',
    zIndex: 2,
  },
  avatarGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 217, 204, 0.2)',
    shadowColor: '#00D9CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#00D9CC',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 3,
  },
  welcomeText: {
    fontSize: 24,
    color: '#00D9CC',
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 5,
  },
  nicknameText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Poppins_400Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  statsContainer: {
    width: '100%',
    paddingHorizontal: 15,
    height: 140,
    justifyContent: 'center',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
    paddingTop: 100,
  },
  modeSelectionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  profileIcon: {
    position: 'absolute',
    top: 80,
    left: 20,
    zIndex: 10,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  profileIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketIcon: {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 10,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  marketIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
 
});

export default HomeScreen;