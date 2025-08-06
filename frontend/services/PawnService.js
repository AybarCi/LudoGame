import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

class PawnService {
  // Token yenileme fonksiyonu
  static async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_URL}/api/refresh-token`, {
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
  }

  // API isteği yapma fonksiyonu (otomatik token yenileme ile)
  static async makeAuthenticatedRequest(url, options = {}) {
    let token = await AsyncStorage.getItem('accessToken');
    
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
  }

  static async getSelectedPawn() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return 'default';

      const response = await this.makeAuthenticatedRequest(`${API_URL}/api/user/selected-pawn`);

      if (response.ok) {
        const data = await response.json();
        return data.selectedPawn || 'default';
      }
    } catch (error) {
      console.error('Error getting selected pawn:', error);
    }
    return 'default';
  }

  static async setSelectedPawn(pawnId) {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return false;

      const response = await this.makeAuthenticatedRequest(`${API_URL}/api/user/select-pawn`, {
        method: 'POST',
        body: JSON.stringify({ pawnId })
      });

      return response.ok;
    } catch (error) {
      console.error('Error setting selected pawn:', error);
      return false;
    }
  }

  // Piyon ID'sinden emoji'yi al
  static getPawnEmoji(pawnId) {
    const PAWN_EMOJIS = {
      'default': '●',
      'emoji_1': '😀',
      'emoji_2': '😎',
      'emoji_3': '🤩',
      'emoji_4': '🥳',
      'emoji_5': '👑',
      'emoji_6': '💎',
      'animal_1': '🐱',
      'animal_2': '🐶',
      'animal_3': '🦁',
      'animal_4': '🐯',
      'animal_5': '🦄',
      'animal_6': '🐉',
      'nature_1': '🌸',
      'nature_2': '🌺',
      'nature_3': '🌟',
      'nature_4': '⚡',
      'nature_5': '🔥',
      'nature_6': '❄️'
    };

    return PAWN_EMOJIS[pawnId] || '●';
  }
}

export { PawnService };