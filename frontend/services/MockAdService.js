// MockAdService.js - Geliştirme ortamı için test reklam servisi
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Web, simülatör ve emülatör kontrolü
const isRealDevice = Platform.OS !== 'web' && Constants.isDevice === true;

class MockAdService {
  static async showMockRewardedAd() {
    return new Promise(async (resolve) => {
      console.log('🎬 Mock Rewarded Ad: Reklam simülasyonu başlatıldı');
      
      // 3 saniyelik reklam simülasyonu
      await this.simulateAdLoading();
      
      // Mock reklam izleme tamamlandı
      const userDidWatchAd = await this.simulateUserWatchingAd();
      
      resolve({ userDidWatchAd });
    });
  }
  
  static async simulateAdLoading() {
    return new Promise(resolve => {
      console.log('📺 Mock Ad: Reklam yükleniyor...');
      setTimeout(() => {
        console.log('✅ Mock Ad: Reklam yüklendi');
        resolve();
      }, 1000);
    });
  }
  
  static async simulateUserWatchingAd() {
    return new Promise(resolve => {
      console.log('⏳ Mock Ad: Kullanıcı reklamı izliyor (5 saniye)...');
      
      // 5 saniyelik izleme simülasyonu
      setTimeout(() => {
        console.log('🎉 Mock Ad: Reklam başarıyla izlendi!');
        console.log('💎 Mock Ad: Ödül kazanıldı (1 elmas)');
        resolve(true);
      }, 5000);
    });
  }
  
  static async showMockInterstitialAd() {
    return new Promise(async (resolve) => {
      console.log('🎬 Mock Interstitial Ad: Geçiş reklamı simülasyonu');
      
      // 2 saniyelik geçiş reklamı
      await this.simulateAdLoading();
      console.log('📺 Mock Interstitial: Reklam gösterildi');
      
      setTimeout(() => {
        console.log('✅ Mock Interstitial: Reklam tamamlandı');
        resolve();
      }, 3000);
    });
  }
}

export { MockAdService };