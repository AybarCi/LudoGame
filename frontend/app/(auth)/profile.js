import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUserNickname } from '../../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeleteAccountModal from '../../components/DeleteAccountModal';
import { API_BASE_URL } from '../../constants/game';

// Backend'den gelen maskelenmiş telefon numarasını doğrudan göster
const maskPhoneNumber = (phoneNumber) => {
  // Backend'den zaten maskelenmiş hâli geliyor, doğrudan göster
  return phoneNumber || '';
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
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [currentNickname, setCurrentNickname] = useState(actualUser?.nickname || '');

  useEffect(() => {
    loadUserProfile();
    loadUserAvatar();
    // actualUser değiştiğinde currentNickname'i güncelle
    if (actualUser?.nickname) {
      setCurrentNickname(actualUser.nickname);
    }
  }, [actualUser?.nickname]);

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
              
              // Piyon verilerini de temizle (ekstra güvenlik için)
              await AsyncStorage.removeItem('ownedPawns');
              await AsyncStorage.removeItem('selectedPawn');
              
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

  const handleEditNickname = () => {
    setNewNickname(currentNickname || '');
    setShowNicknameModal(true);
  };

  const handleNicknameUpdate = async () => {
    if (!newNickname.trim()) {
      Alert.alert('Hata', 'Rumuz boş olamaz.');
      return;
    }

    // Token'ı AsyncStorage'dan al
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      Alert.alert('Hata', 'Kimlik doğrulama hatası. Lütfen tekrar giriş yapın.');
      return;
    }

    console.log('Rumuz güncelleme isteği:', {
      url: `${API_BASE_URL}/api/user/nickname`,
      token: token.substring(0, 10) + '...',
      nickname: newNickname.trim()
    });

    setNicknameLoading(true);
    try {
      const requestBody = { nickname: newNickname.trim() };
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/api/user/nickname`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Response'un içeriğini kontrol et
      const responseText = await response.text();
      console.log('Sunucu yanıtı:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse hatası:', parseError);
        console.error('Sunucu yanıtı:', responseText);
        Alert.alert('Hata', 'Sunucudan beklenmedik yanıt alındı.');
        return;
      }

      if (response.ok && data.success) {
        // Store'daki kullanıcı bilgilerini güncelle
        dispatch(updateUserNickname({ nickname: data.nickname }));
        // Local state'i de güncelle
        setCurrentNickname(data.nickname);
        
        Alert.alert('Başarılı', 'Rumuz başarıyla güncellendi.');
        setShowNicknameModal(false);
      } else {
        Alert.alert('Hata', data.message || 'Rumuz güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Rumuz güncelleme hatası:', error);
      Alert.alert('Hata', 'Rumuz güncellenirken bir hata oluştu.');
    } finally {
      setNicknameLoading(false);
    }
  };

  const handleNicknameCancel = () => {
    setShowNicknameModal(false);
    setNewNickname('');
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
          
          <View style={styles.nicknameContainer}>
            <Text style={styles.nicknameText}>{currentNickname || 'Oyuncu'}</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditNickname}>
              <Ionicons name="pencil" size={16} color="#00D9CC" />
            </TouchableOpacity>
          </View>
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

      {/* Rumuz Düzenleme Modal */}
      <Modal
        visible={showNicknameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleNicknameCancel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rumuz Düzenle</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Yeni rumuzunuzu girin"
              value={newNickname}
              onChangeText={setNewNickname}
              maxLength={50}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleNicknameCancel}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleNicknameUpdate}
                disabled={nicknameLoading}
              >
                {nicknameLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  nicknameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  editButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 217, 204, 0.2)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: 25,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 204, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    color: '#00D9CC',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Poppins_400Regular',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonConfirm: {
    backgroundColor: '#00D9CC',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: 'white',
  },
});

export default ProfileScreen;