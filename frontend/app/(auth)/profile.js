import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import { API_BASE_URL } from '../../constants/game';

// Telefon numarası maskeleme fonksiyonu
const maskPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Sadece rakamları al
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Türkiye formatı varsayımıyla: +90 (XXX) XXX XX XX
  if (digits.length === 10) {
    return `+90 (${digits.slice(0, 3)}) *** ** ${digits.slice(-2)}`;
  } else if (digits.length === 11) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) *** ** ${digits.slice(-2)}`;
  } else {
    // Genel format: ilk 3 ve son 2 hane göster
    const masked = digits.slice(0, 3) + '*'.repeat(Math.max(0, digits.length - 5)) + digits.slice(-2);
    return masked;
  }
};

const ProfileScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const accessToken = useSelector(state => state.auth.accessToken);
  
  // Extract actual user object if it's wrapped in success property
  const actualUser = user?.success && user?.user ? user.user : user;
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userStats, setUserStats] = useState({
    gamesPlayed: 0,
    wins: 0,
    score: 0
  });

  useEffect(() => {
    loadUserProfile();
    loadUserAvatar();
  }, []);

  const loadUserProfile = async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUserStats({
            gamesPlayed: data.user.gamesPlayed || 0,
            wins: data.user.wins || 0,
            score: data.user.score || 0
          });
        }
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
    }
  };

  const loadUserAvatar = async () => {
    if (actualUser?.id) {
      try {
        // Önce AsyncStorage'dan cache'lenmiş avatarı dene
        const cachedAvatar = await AsyncStorage.getItem('userAvatarUrl');
        if (cachedAvatar) {
          setAvatarUrl(cachedAvatar);
        }

        // Get authentication token
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) return;

        // Fetch avatar from server
        const response = await fetch(`${API_BASE_URL}/api/avatar/${actualUser.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.avatarUrl) {
            setAvatarUrl(data.avatarUrl);
            // Cache the avatar URL
            await AsyncStorage.setItem('userAvatarUrl', data.avatarUrl);
          }
        }
      } catch (error) {
        console.error('Avatar yükleme hatası:', error);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Evet', 
          onPress: async () => {
            setLoading(true);
            try {
              // Avatar cache'ini temizle
              await AsyncStorage.removeItem('userAvatarUrl');
              await dispatch(logout());
              router.replace('/login');
            } catch (error) {
              console.error('Çıkış hatası:', error);
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Hesap silindi, çıkış yap ve giriş sayfasına yönlendir
          await AsyncStorage.clear(); // Tüm verileri temizle
          Alert.alert(
            'Hesap Silindi',
            'Hesabınız başarıyla silindi. Uygulama kapatılacak.',
            [
              {
                text: 'Tamam',
                onPress: () => {
                  // Uygulamayı kapat
                  if (typeof navigator !== 'undefined' && navigator.app) {
                    navigator.app.exitApp();
                  } else {
                    router.replace('/login');
                  }
                }
              }
            ]
          );
        } else {
          Alert.alert('Hata', data.message || 'Hesap silme işlemi başarısız oldu.');
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Hata', errorData.message || 'Hesap silme işlemi başarısız oldu.');
      }
    } catch (error) {
      console.error('Hesap silme hatası:', error);
      Alert.alert('Hata', 'Hesap silinirken bir hata oluştu.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleBack = () => {
    router.back();
  };

  if (!actualUser) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D9CC" />
          <Text style={styles.loadingText}>Kullanıcı bilgileri yükleniyor...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Avatar ve Kullanıcı Bilgileri */}
        <View style={styles.userInfoContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={40} color="#00D9CC" />
              )}
            </View>
            <View style={styles.avatarGlow} />
          </View>
          
          <Text style={styles.nicknameText}>{actualUser.nickname || 'Oyuncu'}</Text>
          <Text style={styles.phoneText}>
            {actualUser.phoneNumber ? maskPhoneNumber(actualUser.phoneNumber) : ''}
          </Text>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>İstatistikler</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="game-controller" size={24} color="#00D9CC" />
              <Text style={styles.statLabel}>Oynanan Oyun</Text>
              <Text style={styles.statValue}>{userStats.gamesPlayed}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.statLabel}>Galibiyet</Text>
              <Text style={styles.statValue}>{userStats.wins}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={24} color="#FF6B6B" />
              <Text style={styles.statLabel}>Puan</Text>
              <Text style={styles.statValue}>{userStats.score}</Text>
            </View>
          </View>
        </View>

        {/* Ayarlar */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Hesap Ayarları</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingIcon}>
              <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            </View>
            <Text style={styles.settingText}>Çıkış Yap</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
            <View style={styles.settingIcon}>
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
            </View>
            <Text style={[styles.settingText, styles.deleteText]}>Hesabı Sil</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Hesap Silme Modal */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00D9CC" />
          <Text style={styles.loadingText}>Çıkış yapılıyor...</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  userInfoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#00D9CC',
    zIndex: 2,
  },
  avatarGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0, 217, 204, 0.2)',
    shadowColor: '#00D9CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  nicknameText: {
    fontSize: 22,
    color: '#00D9CC',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  phoneText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Poppins_400Regular',
    marginTop: 5,
  },
  statValue: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'Poppins_700Bold',
    marginTop: 5,
  },
  settingsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Poppins_500Medium',
  },
  deleteText: {
    color: '#FF4444',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Poppins_400Regular',
  },
});

export default ProfileScreen;