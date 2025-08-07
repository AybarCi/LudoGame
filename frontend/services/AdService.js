// AdService.js - Reklam yönetimi için servis
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// AdMob modüllerini sadece gerçek cihazlarda import et
let AdMobInterstitial, AdMobRewarded, setTestDeviceIDAsync;

// Web, simülatör ve emülatör kontrolü
const isRealDevice = Platform.OS !== 'web' && Constants.isDevice === true;

if (isRealDevice) {
  try {
    const admob = require('expo-ads-admob');
    AdMobInterstitial = admob.AdMobInterstitial;
    AdMobRewarded = admob.AdMobRewarded;
    setTestDeviceIDAsync = admob.setTestDeviceIDAsync;
  } catch (error) {
    console.warn('AdMob module not available:', error.message);
  }
}

// Test reklam ID'leri (Google tarafından sağlanan)
const INTERSTITIAL_AD_ID = __DEV__ 
  ? 'ca-app-pub-3940256099942544/1033173712' // Test ID
  : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'; // Gerçek ID

const REWARDED_AD_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/5224354917' // Test ID  
  : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'; // Gerçek ID

class AdService {
  static async initialize() {
    try {
      // Web ortamında ve simülatörde AdMob çalışmaz
      if (!isRealDevice || !setTestDeviceIDAsync) {
        console.log('AdService: Non-real device or AdMob not available, skipping AdMob initialization');
        return;
      }
      
      // Test cihazı ayarla (geliştirme için)
      if (__DEV__) {
        await setTestDeviceIDAsync('EMULATOR');
      }
      
      // Reklamları önceden yükle
      await this.loadAds();
      console.log('AdService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdService:', error);
    }
  }

  static async showInterstitialAd() {
    return new Promise(async (resolve, reject) => {
      try {
        // Web ortamında ve simülatörde AdMob çalışmaz
        if (!isRealDevice || !AdMobInterstitial) {
          console.log('AdService: Non-real device or AdMob not available, skipping interstitial ad');
          resolve();
          return;
        }
        
        // Reklamı yükle
        await AdMobInterstitial.setAdUnitID(INTERSTITIAL_AD_ID);
        await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
        
        // Reklam yüklendiğinde göster
        await AdMobInterstitial.showAdAsync();
        console.log('Interstitial ad shown successfully');
        resolve();
      } catch (error) {
        console.error('Failed to show interstitial ad:', error);
        // Reklam gösterilemezse de devam et
        resolve();
      }
    });
  }

  static async showRewardedAd() {
    return new Promise(async (resolve, reject) => {
      try {
        // Web ortamında ve simülatörde AdMob çalışmaz
        if (!isRealDevice || !AdMobRewarded) {
          console.log('AdService: Non-real device or AdMob not available, skipping rewarded ad');
          resolve({ userDidWatchAd: false });
          return;
        }
        
        // Reklamı yükle
        await AdMobRewarded.setAdUnitID(REWARDED_AD_ID);
        await AdMobRewarded.requestAdAsync({ servePersonalizedAds: true });
        
        // Reklam yüklendiğinde göster
        const result = await AdMobRewarded.showAdAsync();
        console.log('Rewarded ad shown successfully');
        resolve({ userDidWatchAd: true });
      } catch (error) {
        console.error('Failed to show rewarded ad:', error);
        // Reklam gösterilemezse false döndür
        resolve({ userDidWatchAd: false });
      }
    });
  }

  static async loadAds() {
    try {
      // Web ortamında ve simülatörde AdMob çalışmaz
      if (!isRealDevice || !AdMobInterstitial || !AdMobRewarded) {
        console.log('AdService: Non-real device or AdMob not available, skipping ad loading');
        return;
      }
      
      console.log('Loading ads...');
      
      // Interstitial reklamı yükle
      await AdMobInterstitial.setAdUnitID(INTERSTITIAL_AD_ID);
      await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
      
      // Rewarded reklamı yükle
      await AdMobRewarded.setAdUnitID(REWARDED_AD_ID);
      await AdMobRewarded.requestAdAsync({ servePersonalizedAds: true });
      
      console.log('Ads loaded successfully');
    } catch (error) {
      console.error('Failed to load ads:', error);
    }
  }

  static async isInterstitialReady() {
    try {
      // Web ortamında ve simülatörde AdMob çalışmaz
      if (!isRealDevice || !AdMobInterstitial) {
        return false;
      }
      
      return await AdMobInterstitial.getIsReadyAsync();
    } catch (error) {
      console.error('Failed to check interstitial ad status:', error);
      return false;
    }
  }

  static async isRewardedReady() {
    try {
      // Web ortamında ve simülatörde AdMob çalışmaz
      if (!isRealDevice || !AdMobRewarded) {
        return false;
      }
      
      return await AdMobRewarded.getIsReadyAsync();
    } catch (error) {
      console.error('Failed to check rewarded ad status:', error);
      return false;
    }
  }
}

export { AdService };