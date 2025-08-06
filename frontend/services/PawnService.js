import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

class PawnService {
  static async getSelectedPawn() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return 'default';

      const response = await fetch(`${API_URL}/api/user/selected-pawn`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

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
      const token = await AsyncStorage.getItem('token');
      if (!token) return false;

      const response = await fetch(`${API_URL}/api/user/select-pawn`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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