// DiamondService.js - Elmas yönetimi için servis
import AsyncStorage from '@react-native-async-storage/async-storage';

class DiamondService {
  static DIAMOND_KEY = 'user_diamonds';
  static DAILY_REWARD_KEY = 'daily_reward_claimed';
  
  // Kullanıcının elmas sayısını getir
  static async getDiamonds() {
    try {
      const diamonds = await AsyncStorage.getItem(this.DIAMOND_KEY);
      return diamonds ? parseInt(diamonds) : 0;
    } catch (error) {
      console.error('Error getting diamonds:', error);
      return 0;
    }
  }

  // Elmas ekle
  static async addDiamonds(amount) {
    try {
      const currentDiamonds = await this.getDiamonds();
      const newAmount = currentDiamonds + amount;
      await AsyncStorage.setItem(this.DIAMOND_KEY, newAmount.toString());
      return newAmount;
    } catch (error) {
      console.error('Error adding diamonds:', error);
      return await this.getDiamonds();
    }
  }

  // Elmas harca
  static async spendDiamonds(amount) {
    try {
      const currentDiamonds = await this.getDiamonds();
      if (currentDiamonds >= amount) {
        const newAmount = currentDiamonds - amount;
        await AsyncStorage.setItem(this.DIAMOND_KEY, newAmount.toString());
        return { success: true, newAmount };
      }
      return { success: false, message: 'Yetersiz elmas!' };
    } catch (error) {
      console.error('Error spending diamonds:', error);
      return { success: false, message: 'Hata oluştu!' };
    }
  }

  // Oyun kazanma ödülü
  static async rewardForWin(gameMode) {
    const rewardAmount = gameMode === 'ai' || gameMode === 'online' ? 1 : 0;
    if (rewardAmount > 0) {
      return await this.addDiamonds(rewardAmount);
    }
    return await this.getDiamonds();
  }

  // Reklam izleme ödülü
  static async rewardForAd() {
    const rewardAmount = 2; // Reklam başına 2 elmas
    return await this.addDiamonds(rewardAmount);
  }

  // Günlük ödül kontrolü
  static async canClaimDailyReward() {
    try {
      const lastClaimed = await AsyncStorage.getItem(this.DAILY_REWARD_KEY);
      if (!lastClaimed) return true;
      
      const lastClaimedDate = new Date(lastClaimed);
      const today = new Date();
      
      // Farklı günse ödül alabilir
      return lastClaimedDate.toDateString() !== today.toDateString();
    } catch (error) {
      console.error('Error checking daily reward:', error);
      return false;
    }
  }

  // Günlük ödül al
  static async claimDailyReward() {
    try {
      const canClaim = await this.canClaimDailyReward();
      if (canClaim) {
        const rewardAmount = 5; // Günlük 5 elmas
        const newAmount = await this.addDiamonds(rewardAmount);
        await AsyncStorage.setItem(this.DAILY_REWARD_KEY, new Date().toISOString());
        return { success: true, amount: rewardAmount, newTotal: newAmount };
      }
      return { success: false, message: 'Günlük ödül zaten alındı!' };
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      return { success: false, message: 'Hata oluştu!' };
    }
  }

  // Elmas geçmişini temizle (test için)
  static async resetDiamonds() {
    try {
      await AsyncStorage.removeItem(this.DIAMOND_KEY);
      await AsyncStorage.removeItem(this.DAILY_REWARD_KEY);
      return true;
    } catch (error) {
      console.error('Error resetting diamonds:', error);
      return false;
    }
  }
}

export { DiamondService };