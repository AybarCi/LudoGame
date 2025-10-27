// AdService.js - Reklam yönetimi için servis
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// react-native-google-mobile-ads sadece EAS build'te çalışır
// Expo Go'da çalışmaz, bu yüzden conditional import yapıyoruz
let mobileAds, InterstitialAd, RewardedAd, TestIds, AdEventType, RewardedAdEventType;

try {
  const adsModule = require('react-native-google-mobile-ads');
  mobileAds = adsModule.default;
  InterstitialAd = adsModule.InterstitialAd;
  RewardedAd = adsModule.RewardedAd;
  TestIds = adsModule.TestIds;
  AdEventType = adsModule.AdEventType;
  RewardedAdEventType = adsModule.RewardedAdEventType;
} catch (error) {
  console.log('react-native-google-mobile-ads not available in Expo Go, will use mock ads');
}

// Web, simülatör ve emülatör kontrolü
const isRealDevice = Platform.OS !== 'web' && Constants.isDevice === true;

// Test modu kontrolü: geliştirme veya simülatör/emülatör (gerçek cihaz değil)
const isTestMode = __DEV__ || !Constants.isDevice;

// AdMob başlatıldı
console.log('AdMob enabled with react-native-google-mobile-ads');
console.log('Test mode:', isTestMode ? 'AÇIK' : 'KAPALI');

// CRASH PREVENTION: Temporarily disable AdMob for testing
const ADMOB_DISABLED = false;
if (ADMOB_DISABLED) {
  console.warn('⚠️ ADMOB DISABLED FOR CRASH TESTING ⚠️');
}

// Mock reklam servisi (geliştirme ortamı için)
const MockAdService = {
  showMockRewardedAd: async () => {
    return new Promise(async (resolve) => {
      console.log('🎬 Mock Rewarded Ad: Reklam simülasyonu başlatıldı');
      
      // 3 saniyelik reklam simülasyonu
      await new Promise(r => setTimeout(r, 1000));
      console.log('✅ Mock Ad: Reklam yüklendi');
      
      console.log('⏳ Mock Ad: Kullanıcı reklamı izliyor (3 saniye)...');
      await new Promise(r => setTimeout(r, 3000));
      
      console.log('🎉 Mock Ad: Reklam başarıyla izlendi!');
      console.log('💎 Mock Ad: Ödül kazanıldı (1 elmas)');
      resolve({ userDidWatchAd: true });
    });
  },
  
  showMockInterstitialAd: async () => {
    return new Promise(async (resolve) => {
      console.log('🎬 Mock Interstitial Ad: Geçiş reklamı simülasyonu');
      await new Promise(r => setTimeout(r, 1000));
      console.log('📺 Mock Interstitial: Reklam gösterildi');
      await new Promise(r => setTimeout(r, 2000));
      console.log('✅ Mock Interstitial: Reklam tamamlandı');
      resolve();
    });
  }
};

// Test reklam ID'leri (Google tarafından sağlanan)
// Expo Go'da TestIds undefined olabilir, bu yüzden fallback değerler kullan
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

// Environment variable'lardan ID'leri oku, yoksa hardcoded değerleri kullan
const envInterstitialId = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID;
const envRewardedId = process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID;

let INTERSTITIAL_AD_ID = __DEV__
  ? (TestIds?.INTERSTITIAL || TEST_INTERSTITIAL_ID) // Test ID veya fallback
  : (envInterstitialId || Platform.select({
      ios: 'ca-app-pub-1743455537598911/4233374921', // iOS interstitial fallback
      android: 'ca-app-pub-1743455537598911/4233374921' // Android interstitial fallback
    }));

let REWARDED_AD_ID = __DEV__
  ? (TestIds?.REWARDED || TEST_REWARDED_ID) // Test ID veya fallback
  : (envRewardedId || Platform.select({
      ios: 'ca-app-pub-1743455537598911/9106427653', // iOS rewarded fallback
      android: 'ca-app-pub-1743455537598911/9106427653' // Android rewarded fallback
    }));

// Güvenlik: Yanlışlıkla aynı ID verilmişse ödüllü reklamı test ID'sine çevir
if (!__DEV__ && envRewardedId && envInterstitialId && envRewardedId === envInterstitialId) {
  console.warn('AdService: REWARDED_AD_ID and INTERSTITIAL_AD_ID are identical. Falling back to test rewarded ID.');
  REWARDED_AD_ID = TEST_REWARDED_ID;
}

// Reklam instance'ları
let interstitialAd = null;
let rewardedAd = null;

class AdService {
  static async initialize() {
    try {
      // CRASH PREVENTION: Skip AdMob initialization
      if (ADMOB_DISABLED) {
        console.log('AdService: SKIPPED - AdMob disabled for crash testing');
        return;
      }
      
      // Eğer mobileAds yoksa (Expo Go'da), sadece mock servisi kullan
      if (!mobileAds) {
        console.log('AdService: Mobile ads not available, using mock ads only');
        return;
      }
      
      // Google Mobile Ads SDK'yı başlat
      console.log('Initializing Google Mobile Ads SDK...');
      await mobileAds().initialize();
      console.log('Google Mobile Ads SDK initialized successfully');
      
      // Web ortamında ve simülatörde AdMob çalışmaz
      if (!isRealDevice) {
        console.log('AdService: Non-real device, skipping AdMob initialization');
        return;
      }
      
      // Reklam instance'larını oluştur
      interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_ID, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['game', 'ludo', 'board game']
      });
      
      rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_ID, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['game', 'ludo', 'board game']
      });
      
      console.log('AdService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdService:', error);
    }
  }

  static async showInterstitialAd() {
    return new Promise(async (resolve, reject) => {
      try {
        // Web ortamında, simülatörde veya mobileAds yoksa mock servis kullan
        if (!mobileAds || !isRealDevice || !interstitialAd) {
          console.log('AdService: Using mock interstitial ad (mobileAds not available or not real device)');
          
          // Geliştirme ortamında mock reklam göster
          if (__DEV__) {
            await MockAdService.showMockInterstitialAd();
          }
          
          resolve();
          return;
        }
        
        // Reklam yüklendiğinde göster
        const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
          console.log('Interstitial ad loaded');
        });
        
        const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
          console.log('Interstitial ad closed');
          unsubscribeLoaded();
          unsubscribeClosed();
          resolve();
        });
        
        const unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
          console.error('Interstitial ad error:', error);
          unsubscribeLoaded();
          unsubscribeClosed();
          unsubscribeError();
          resolve(); // Hata olsa da devam et
        });
        
        // Reklamı yükle ve göster
        await interstitialAd.load();
        await interstitialAd.show();
        console.log('Interstitial ad shown successfully');
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
        // Geliştirme veya web ortamında mock reklam kullan
        if (isTestMode) {
          console.log('AdService: Test/Simülatör ortamı - Mock rewarded reklam');
          const result = await MockAdService.showMockRewardedAd();
          resolve(result);
          return;
        }

        // SDK mevcut değilse veya gerçek cihaz değilse
        if (!mobileAds || !isRealDevice) {
          console.log('AdService: MobileAds yok veya gerçek cihaz değil');
          resolve({ userDidWatchAd: false });
          return;
        }

        // Her gösterim için taze RewardedAd instance oluştur
        rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_ID, {
          requestNonPersonalizedAdsOnly: true,
          keywords: ['game', 'ludo', 'board game']
        });

        let userDidWatchAd = false;

        // Ödül kazanıldığında
        const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
          console.log('RewardedAd: EARNED_REWARD', reward);
          userDidWatchAd = true;
        });

        // Reklam yüklendiğinde göster
        const unsubscribeLoaded = rewardedAd.addAdEventListener(AdEventType.LOADED, async () => {
          console.log('RewardedAd: LOADED, showing');
          try {
            await rewardedAd.show();
          } catch (showErr) {
            console.error('RewardedAd show error:', showErr);
          }
        });

        // Reklam kapandığında sonucu döndür
        const unsubscribeClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
          console.log('RewardedAd: CLOSED, watched =', userDidWatchAd);
          unsubscribeEarned();
          unsubscribeLoaded();
          unsubscribeClosed();
          resolve({ userDidWatchAd });
        });

        // Yükleme/gösterme hatası
        const unsubscribeError = rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
          console.error('RewardedAd: ERROR', error);
          unsubscribeEarned();
          unsubscribeLoaded();
          unsubscribeClosed();
          unsubscribeError();
          resolve({ userDidWatchAd: false });
        });

        // Yüklemeyi tetikle
        rewardedAd.load();
        
        // Güvenli zaman aşımı: 12 sn içinde kapanmazsa başarısız say
        setTimeout(() => {
          try {
            unsubscribeEarned();
            unsubscribeLoaded();
            unsubscribeClosed();
            unsubscribeError();
          } catch (_) {}
          resolve({ userDidWatchAd: false });
        }, 12000);
        
      } catch (error) {
        console.error('Failed to show rewarded ad:', error);
        // Hata durumunda event listener'ları temizle
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