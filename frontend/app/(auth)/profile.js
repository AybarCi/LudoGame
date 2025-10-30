import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity, Image, Modal, TextInput, Linking } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUserNickname, updateUserAvatar, setUser } from '../../store/slices/authSlice';
import { API_BASE_URL } from '../../constants/game';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeleteAccountModal from '../../components/DeleteAccountModal';


// Avatar URL normalize: yanlış base (örn. 10.22.233.37) geldiyse production base’e çevir
const normalizeAvatarUrl = (url) => {
  if (!url) return null;
  try {
    // Eğer /uploads ile başlıyorsa API_BASE_URL ile birleştir
    if (url.startsWith('/uploads')) {
      return `${API_BASE_URL}${url}`;
    }
    // Farklı bir origin içeriyorsa origin'i API_BASE_URL ile değiştir
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
    // Base64 inline görsel için cache-bust ekleme
    if (url.startsWith('data:')) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}t=${Date.now()}`;
  } catch (e) {
    return url;
  }
};

// Telefon gösterimi: backend maskeleri varsa öncelik ver, aksi halde güvenli maskele
const getDisplayPhone = (user) => {
  console.log('[getDisplayPhone] User object:', user);
  console.log('[getDisplayPhone] Available phone fields:', {
    maskedPhone: user?.maskedPhone,
    obfuscatedPhone: user?.obfuscatedPhone,
    phoneMasked: user?.phoneMasked,
    gsmMasked: user?.gsmMasked,
    phoneNumber: user?.phoneNumber,
    phone: user?.phone,
    msisdn: user?.msisdn
  });
  
  // Öncelikle backend'den gelen maskelenmiş telefon numaralarını kontrol et
  const maskedCandidates = [
    user?.maskedPhone,
    user?.obfuscatedPhone,
    user?.phoneMasked,
    user?.gsmMasked
  ].filter(Boolean);
  
  if (maskedCandidates.length > 0) {
    console.log('[getDisplayPhone] Found masked phone:', maskedCandidates[0]);
    return maskedCandidates[0];
  }
  
  // Ham telefon numarasını al
  const raw = user?.phoneNumber || user?.phone || user?.msisdn || '';
  console.log('[getDisplayPhone] Raw phone number:', raw);
  
  if (!raw) {
    console.log('[getDisplayPhone] No phone number found');
    return '';
  }
  
  // Sadece rakamları al
  const digits = raw.replace(/\D/g, '');
  console.log('[getDisplayPhone] Cleaned digits:', digits);
  
  if (!digits) {
    console.log('[getDisplayPhone] No digits found after cleaning');
    return '';
  }
  
  // Türkiye veya uluslararası numara formatına göre maskeleme
  if (digits.length === 10) {
    // Türkiye: 5069384413 -> 506 *** 44 13
    const masked = `${digits.slice(0, 3)} *** ${digits.slice(6, 8)} ${digits.slice(-2)}`;
    console.log('[getDisplayPhone] Turkish phone (10 digits):', masked);
    return masked;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // Türkiye: 05069384413 -> 506 *** 44 13
    const masked = `${digits.slice(1, 4)} *** ${digits.slice(7, 9)} ${digits.slice(-2)}`;
    console.log('[getDisplayPhone] Turkish phone (11 digits with 0):', masked);
    return masked;
  } else if (digits.length >= 10 && digits.length <= 14) {
    // Uluslararası: +905069384413 -> +90 *** *** 13
    const countryCode = digits.slice(0, digits.length - 10);
    const mainNumber = digits.slice(-10);
    const last2 = mainNumber.slice(-2);
    const masked = `+${countryCode} *** *** ${last2}`;
    console.log('[getDisplayPhone] International phone:', masked);
    return masked;
  }
  
  console.log('[getDisplayPhone] Returning raw or empty');
  return raw.length > 20 ? '' : raw;
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
    
    // Sayfa her açıldığında kullanıcı verisini güncelle
    const refreshUserData = async () => {
      if (accessToken) {
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
            console.log('[Profile] User data refreshed:', data);
            if (data.success && data.user) {
              // AsyncStorage'daki kullanıcı verisini güncelle
              await AsyncStorage.setItem('user', JSON.stringify(data.user));
              
              // Redux store'daki kullanıcıyı güncelle
              dispatch(setUser(data.user));
              
              // Telefon numarasını kontrol et
              console.log('[Profile] Phone data after refresh:', {
                phoneNumber: data.user.phoneNumber,
                maskedPhone: data.user.maskedPhone,
                obfuscatedPhone: data.user.obfuscatedPhone
              });
            }
          }
        } catch (error) {
          console.error('[Profile] User data refresh error:', error);
        }
      }
    };
    
    refreshUserData();
  }, [actualUser?.nickname, accessToken]);

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
            const normalized = normalizeAvatarUrl(data.avatarUrl);
            const busted = withCacheBust(normalized);
            setAvatarUrl(busted);
            // Cache'e cache-bust olmadan yaz (kalıcılık için)
            await AsyncStorage.setItem('userAvatarUrl', normalized);
          }
        }
      } catch (error) {
        console.error('Avatar yükleme hatası:', error);
      }
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Fotoğraf yüklemek için galeri izni gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Size = result.assets[0].base64.length * 0.75; // yaklaşık byte boyutu
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        if (base64Size > maxSize) {
          Alert.alert('Hata', 'Fotoğraf çok büyük. Lütfen daha küçük bir fotoğraf seçin (max 5MB).');
          return;
        }
        await uploadAvatar(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Fotoğraf seçme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const uploadAvatar = async (base64Image) => {
    if (!actualUser?.id) {
      Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Hata', 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: actualUser.id,
          avatarUrl: `data:image/jpeg;base64,${base64Image}`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.avatarUrl) {
          const normalized = normalizeAvatarUrl(data.avatarUrl);
          const busted = withCacheBust(normalized);
          setAvatarUrl(busted);
          // Store ve cache'i güncelle
          await AsyncStorage.setItem('userAvatarUrl', normalized);
          dispatch(updateUserAvatar({ avatarUrl: normalized }));
        } else {
          const inlineUrl = `data:image/jpeg;base64,${base64Image}`;
          setAvatarUrl(inlineUrl);
          await AsyncStorage.setItem('userAvatarUrl', inlineUrl);
          dispatch(updateUserAvatar({ avatarUrl: inlineUrl }));
        }
        Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi.');
      } else {
        Alert.alert('Hata', data.message || 'Fotoğraf yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Avatar yükleme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
    } finally {
      setUploadingAvatar(false);
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

  const openPrivacy = () => {
    Linking.openURL('https://ludoturco.com/privacy');
  };

  const openTerms = () => {
    Linking.openURL('https://ludoturco.com/terms');
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
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={pickImage}
            activeOpacity={0.8}
            disabled={uploadingAvatar}
          >
            <View style={styles.avatarCircle}>
              {uploadingAvatar ? (
                <ActivityIndicator size="large" color="#00D9CC" />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={40} color="#00D9CC" />
              )}
            </View>
            <View style={styles.avatarGlow} />
            <View style={styles.avatarEditIcon}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.nicknameContainer}>
            <Text style={styles.nicknameText}>{currentNickname || 'Oyuncu'}</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditNickname}>
              <Ionicons name="pencil" size={16} color="#00D9CC" />
            </TouchableOpacity>
          </View>
          <Text style={styles.phoneText}>
            {getDisplayPhone(actualUser)}
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

        {/* Yasal Bağlantılar */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Yasal</Text>

          <TouchableOpacity style={styles.settingItem} onPress={openPrivacy}>
            <View style={styles.settingIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#00D9CC" />
            </View>
            <Text style={styles.settingText}>Gizlilik Politikası</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={openTerms}>
            <View style={styles.settingIcon}>
              <Ionicons name="document-text-outline" size={20} color="#00D9CC" />
            </View>
            <Text style={styles.settingText}>Kullanım Şartları</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Ayarlar */}
        <View style={[styles.settingsContainer, styles.legalContainer]}>
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
  avatarEditIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
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
  legalContainer: {
    marginTop: 20,
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