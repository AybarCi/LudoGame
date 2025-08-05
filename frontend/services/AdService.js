// AdService.js - Reklam yönetimi için servis

class AdService {
  static async showInterstitialAd() {
    return new Promise((resolve, reject) => {
      // Geliştirme ortamında reklam simülasyonu
      if (__DEV__) {
        console.log('Development mode: Simulating ad display');
        setTimeout(() => {
          console.log('Ad simulation completed');
          resolve();
        }, 1000);
        return;
      }

      // Prodüksiyon ortamında gerçek reklam entegrasyonu
      // Bu kısım AdMob, Facebook Ads vb. ile entegre edilebilir
      try {
        // Örnek: AdMob interstitial ad gösterimi
        // await AdMobInterstitial.showAdAsync();
        console.log('Interstitial ad shown');
        resolve();
      } catch (error) {
        console.error('Failed to show interstitial ad:', error);
        reject(error);
      }
    });
  }

  static async showRewardedAd() {
    return new Promise((resolve, reject) => {
      // Geliştirme ortamında reklam simülasyonu
      if (__DEV__) {
        console.log('Development mode: Simulating rewarded ad display');
        setTimeout(() => {
          console.log('Rewarded ad simulation completed');
          resolve({ userDidWatchAd: true });
        }, 1500);
        return;
      }

      // Prodüksiyon ortamında gerçek reklam entegrasyonu
      try {
        // Örnek: AdMob rewarded ad gösterimi
        // const result = await AdMobRewarded.showAdAsync();
        console.log('Rewarded ad shown');
        resolve({ userDidWatchAd: true });
      } catch (error) {
        console.error('Failed to show rewarded ad:', error);
        reject(error);
      }
    });
  }

  static async loadAds() {
    try {
      // Reklamları önceden yükle
      console.log('Loading ads...');
      // await AdMobInterstitial.requestAdAsync();
      // await AdMobRewarded.requestAdAsync();
      console.log('Ads loaded successfully');
    } catch (error) {
      console.error('Failed to load ads:', error);
    }
  }
}

export { AdService };