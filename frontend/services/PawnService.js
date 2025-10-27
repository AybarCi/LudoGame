import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/game';
import { getEmojiForId } from './CategoryEmojiService';

const API_URL = API_BASE_URL;

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
      if (response.ok) {
        // Try to read selected pawn from response; fallback to requested pawnId
        let selected = pawnId;
        try {
          const data = await response.json();
          if (data && typeof data.selectedPawn === 'string') {
            selected = data.selectedPawn;
          }
        } catch (e) {
          // Ignore body parse errors; use fallback
        }
        await AsyncStorage.setItem('selectedPawn', selected);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting selected pawn:', error);
      return false;
    }
  }

  // Piyon ID'sinden emoji'yi al
  static getPawnEmoji(pawnId) {
    if (!pawnId) return '●';
    // Önce statik haritaya bak
    const PAWN_EMOJIS = {
      'default': '●',
      'team_1': '⚽',
      'team_2': '⚽',
      'team_3': '⚽',
      'team_4': '⚽',
      'team_5': '⚽',
      'team_6': '⚽',
      'team_7': '⚽',
      'team_8': '⚽',
      'team_9': '⚽',
      'team_10': '⚽',
      'team_11': '⚽',
      'team_12': '⚽',
      'emoji_1': '😀',
      'emoji_2': '😎',
      'emoji_3': '🤩',
      'emoji_4': '🥳',
      'emoji_5': '👑',
      'emoji_6': '💎',
      'emoji_7': '🚀',
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
    if (PAWN_EMOJIS[pawnId]) return PAWN_EMOJIS[pawnId];

    // Otomatik üretilen kategori ID'leri için gerçek emojiyi hesapla
    const computed = getEmojiForId(pawnId);
    if (computed) return computed;

    // Diğer kategori bazlı basit fallbacks (marka vb.)
    if (pawnId.startsWith('brand_')) return '🏷️';
    // Son çare
    return '●';
  }

  // Marka piyon mu?
  static isBrandPawn(pawnId) {
    if (!pawnId) return false;
    const BRAND_TYPES = ['aura','vortex','stellar','nexus','phoenix','titan','merseles','avudi','bememe'];
    return pawnId.startsWith('brand_') || BRAND_TYPES.includes(pawnId);
  }

  // Marka piyonunun logo tipini al
  static getBrandLogoType(pawnId) {
    if (!pawnId) return null;
    const BRAND_TYPES = ['aura','vortex','stellar','nexus','phoenix','titan','merseles','avudi','bememe'];
    if (BRAND_TYPES.includes(pawnId)) return pawnId; // alias olarak doğrudan logo tipi
    if (pawnId.startsWith('brand_')) {
      const brandLogoMap = {
        'brand_1': 'aura',
        'brand_2': 'vortex',
        'brand_3': 'stellar',
        'brand_4': 'nexus',
        'brand_5': 'phoenix',
        'brand_6': 'titan',
        'brand_7': 'merseles',
        'brand_8': 'avudi',
        'brand_9': 'bememe'
      };
      return brandLogoMap[pawnId] || null;
    }
    return null;
  }

  // Takım piyonu renklerini al
  static getTeamColors(pawnId) {
    const TEAM_COLORS = {
      'team_1': ['#000000', '#FFFFFF'],
      'team_2': ['#FFD700', '#FF0000'],
      'team_3': ['#FFFF00', '#000080'],
      'team_4': ['#800080', '#87CEEB'],
      'team_5': ['#FF4500', '#000080'],
      'team_6': ['#FF4500', '#008000'],
      'team_7': ['#FF0000', '#FFFFFF'],
      'team_8': ['#008000', '#FFFFFF'],
      'team_9': ['#FF0000', '#FFFFFF'],
      'team_10': ['#FF0000', '#FFD700'],
      'team_11': ['#0000FF', '#008000'],
      'team_12': ['#FF0000', '#000000']
    };

    return TEAM_COLORS[pawnId] || [];
  }

  // Piyon takım piyonu mu kontrol et
  static isTeamPawn(pawnId) {
    return pawnId && pawnId.startsWith('team_');
  }
}

export { PawnService };