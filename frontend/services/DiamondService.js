import AsyncStorage from '@react-native-async-storage/async-storage';

const DIAMONDS_KEY = 'user_diamonds';
const DAILY_REWARD_KEY = 'daily_reward_last_claim';
const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'}/api`;

export const DiamondService = {
  // API'den access token al
  async getAccessToken() {
    try {
      return await AsyncStorage.getItem('accessToken');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  },

  // Token yenileme fonksiyonu
  async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      const { accessToken, user } = data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      return accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  // API isteği yapma fonksiyonu (otomatik token yenileme ile)
  async makeAuthenticatedRequest(url, options = {}) {
    let token = await this.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    const requestOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    let response = await fetch(url, requestOptions);

    // 401 veya 403 hatası alırsak token yenilemeyi dene
    if (response.status === 401 || response.status === 403) {
      try {
        token = await this.refreshToken();
        requestOptions.headers['Authorization'] = `Bearer ${token}`;
        response = await fetch(url, requestOptions);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        throw new Error('Authentication failed');
      }
    }

    return response;
  },

  // Sunucudan elmas sayısını getir ve AsyncStorage'ı güncelle
  async syncDiamondsFromServer() {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        // Token yoksa AsyncStorage'dan oku
        return await this.getDiamondsFromStorage();
      }

      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/user/diamonds`);

      if (response.ok) {
        const data = await response.json();
        // Sunucudan gelen veriyi AsyncStorage'a kaydet
        await AsyncStorage.setItem(DIAMONDS_KEY, data.diamonds.toString());
        return data.diamonds;
      } else {
        // API hatası durumunda AsyncStorage'dan oku
        return await this.getDiamondsFromStorage();
      }
    } catch (error) {
      console.error('Error syncing diamonds from server:', error);
      // Hata durumunda AsyncStorage'dan oku
      return await this.getDiamondsFromStorage();
    }
  },

  // AsyncStorage'dan elmas sayısını getir
  async getDiamondsFromStorage() {
    try {
      const diamonds = await AsyncStorage.getItem(DIAMONDS_KEY);
      return diamonds ? parseInt(diamonds) : 0;
    } catch (error) {
      console.error('Error getting diamonds from storage:', error);
      return 0;
    }
  },

  // Elmas sayısını getir (önce sunucudan sync et)
  async getDiamonds() {
    return await this.syncDiamondsFromServer();
  },

  // Elmas ekleme (sunucuya da gönder)
  async addDiamonds(amount) {
    try {
      const token = await this.getAccessToken();
      if (token) {
        // Sunucuya gönder
        const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/user/diamonds/add`, {
          method: 'POST',
          body: JSON.stringify({ amount })
        });

        if (response.ok) {
          const data = await response.json();
          // Sunucudan gelen güncel veriyi AsyncStorage'a kaydet
          await AsyncStorage.setItem(DIAMONDS_KEY, data.diamonds.toString());
          return data.diamonds;
        }
      }
      
      // Sunucu başarısız olursa sadece AsyncStorage'ı güncelle
      const currentDiamonds = await this.getDiamondsFromStorage();
      const newDiamonds = currentDiamonds + amount;
      await AsyncStorage.setItem(DIAMONDS_KEY, newDiamonds.toString());
      return newDiamonds;
    } catch (error) {
      console.error('Error adding diamonds:', error);
      // Hata durumunda sadece AsyncStorage'ı güncelle
      const currentDiamonds = await this.getDiamondsFromStorage();
      const newDiamonds = currentDiamonds + amount;
      await AsyncStorage.setItem(DIAMONDS_KEY, newDiamonds.toString());
      return newDiamonds;
    }
  },

  // Elmas harcama (sunucuya da gönder)
  async spendDiamonds(amount) {
    try {
      const token = await this.getAccessToken();
      if (token) {
        // Sunucuya gönder
        const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/user/diamonds/spend`, {
          method: 'POST',
          body: JSON.stringify({ amount })
        });

        if (response.ok) {
          const data = await response.json();
          // Sunucudan gelen güncel veriyi AsyncStorage'a kaydet
          await AsyncStorage.setItem(DIAMONDS_KEY, data.diamonds.toString());
          return true;
        } else {
          // Hata durumunda JSON parse etmeye çalışmadan önce content-type kontrol et
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            if (errorData.error === 'Insufficient diamonds') {
              return false;
            }
          } else {
            console.error('Server returned non-JSON response:', response.status, response.statusText);
            return false;
          }
        }
      }
      
      // Sunucu başarısız olursa sadece AsyncStorage'ı kontrol et
      const currentDiamonds = await this.getDiamondsFromStorage();
      if (currentDiamonds >= amount) {
        const newDiamonds = currentDiamonds - amount;
        await AsyncStorage.setItem(DIAMONDS_KEY, newDiamonds.toString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error spending diamonds:', error);
      // Hata durumunda sadece AsyncStorage'ı kontrol et
      const currentDiamonds = await this.getDiamondsFromStorage();
      if (currentDiamonds >= amount) {
        const newDiamonds = currentDiamonds - amount;
        await AsyncStorage.setItem(DIAMONDS_KEY, newDiamonds.toString());
        return true;
      }
      return false;
    }
  },

  // Oyun kazanma ödülü
  async rewardForWin() {
    return await this.addDiamonds(2);
  },

  // Online oyun kazanma ödülü (1 elmas + 10 puan)
  async awardGameWin() {
    try {
      // 1 elmas ekle
      await this.addDiamonds(1);
      
      // 10 puan ekle (backend API'sine istek gönder)
      const accessToken = await this.getAccessToken();
      if (accessToken) {
        const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/user/score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ points: 10 }),
        });
        
        if (response.success) {
          console.log('Online oyun kazanma ödülü verildi: 1 elmas + 10 puan');
          return { success: true, diamonds: 1, points: 10 };
        }
      }
      
      return { success: true, diamonds: 1, points: 0 };
    } catch (error) {
      console.error('Online oyun ödülü verme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Reklam izleme ödülü
  async rewardForAd() {
    return await this.addDiamonds(1);
  },

  // Günlük ödül kontrolü
  async canClaimDailyReward() {
    try {
      const lastClaim = await AsyncStorage.getItem(DAILY_REWARD_KEY);
      if (!lastClaim) return true;
      
      const lastClaimDate = new Date(lastClaim);
      const today = new Date();
      
      // Aynı gün içinde mi kontrol et
      return lastClaimDate.toDateString() !== today.toDateString();
    } catch (error) {
      console.error('Error checking daily reward:', error);
      return false;
    }
  },

  // Günlük ödül al
  async claimDailyReward() {
    try {
      const canClaim = await this.canClaimDailyReward();
      if (canClaim) {
        const today = new Date().toISOString();
        await AsyncStorage.setItem(DAILY_REWARD_KEY, today);
        return await this.addDiamonds(5);
      }
      return false;
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      return false;
    }
  },

  // Elmasları sıfırla (test amaçlı)
  async resetDiamonds() {
    try {
      await AsyncStorage.removeItem(DIAMONDS_KEY);
      return true;
    } catch (error) {
      console.error('Error resetting diamonds:', error);
      return false;
    }
  }
};