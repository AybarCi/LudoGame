import { Platform } from 'react-native';
import { DiamondService } from './DiamondService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safely import expo-in-app-purchases - DISABLED for SDK 53 compatibility
let InAppPurchases = null;
// InAppPurchases = require('expo-in-app-purchases'); // CRASH RISK - DISABLED
try {
  // InAppPurchases = require('expo-in-app-purchases'); // CRASH RISK - DISABLED
  console.warn('In-app purchases disabled for SDK 53 compatibility');
} catch (error) {
  console.warn('expo-in-app-purchases not available:', error.message);
}

// Elmas paketleri
const DIAMOND_PACKAGES = {
  small: {
    productId: Platform.OS === 'ios' ? 'com.ludogame.diamonds.100' : 'diamonds_100',
    diamonds: 100,
    price: '$1.99',
    title: 'Küçük Elmas Paketi',
    description: '100 Elmas'
  },
  medium: {
    productId: Platform.OS === 'ios' ? 'com.ludogame.diamonds.250' : 'diamonds_250',
    diamonds: 250,
    price: '$3.49',
    title: 'Orta Elmas Paketi',
    description: '250 Elmas'
  },
  large: {
    productId: Platform.OS === 'ios' ? 'com.ludogame.diamonds.500' : 'diamonds_500',
    diamonds: 500,
    price: '$5.99',
    title: 'Büyük Elmas Paketi',
    description: '500 Elmas'
  },
  mega: {
    productId: Platform.OS === 'ios' ? 'com.ludogame.diamonds.1000' : 'diamonds_1000',
    diamonds: 1000,
    price: '$9.99',
    title: 'Mega Elmas Paketi',
    description: '1000 Elmas'
  }
};

import { API_BASE_URL as API_BASE_ORIGIN } from '../constants/game';
const API_BASE_URL = `${API_BASE_ORIGIN}/api`;

export const PurchaseService = {
  // In-App Purchase'ı başlat
  async initialize() {
    try {
      if (!InAppPurchases) {
        console.warn('InAppPurchases module not available');
        return false;
      }

      const isAvailable = await InAppPurchases.isAvailableAsync();
      if (!isAvailable) {
        console.warn('In-app purchases are not available on this device');
        return false;
      }

      await InAppPurchases.connectAsync();
      console.log('In-app purchases initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize in-app purchases:', error);
      return false;
    }
  },

  // Ürünleri yükle
  async loadProducts() {
    try {
      if (!InAppPurchases) {
        console.warn('InAppPurchases module not available');
        return [];
      }

      const productIds = Object.values(DIAMOND_PACKAGES).map(pkg => pkg.productId);
      const { results, responseCode } = await InAppPurchases.getProductsAsync(productIds);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        return results;
      } else {
        console.error('Failed to load products:', responseCode);
        return [];
      }
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  },

  // Satın alma işlemi
  async purchaseProduct(productId) {
    try {
      if (!InAppPurchases) {
        return {
          success: false,
          error: 'InAppPurchases module not available'
        };
      }

      const { results, responseCode } = await InAppPurchases.purchaseItemAsync(productId);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        const purchase = results[0];
        
        // Satın alma işlemini doğrula ve elmasları ver
        await this.processPurchase(purchase);
        
        return {
          success: true,
          purchase
        };
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        return {
          success: false,
          error: 'Satın alma iptal edildi'
        };
      } else {
        return {
          success: false,
          error: 'Satın alma başarısız oldu'
        };
      }
    } catch (error) {
      console.error('Purchase error:', error);
      return {
        success: false,
        error: 'Satın alma sırasında hata oluştu'
      };
    }
  },

  // Satın alma işlemini sunucuda doğrula ve elmasları ver
  async processPurchase(purchase) {
    try {
      // Hangi paketi satın aldığını bul
      const packageInfo = Object.values(DIAMOND_PACKAGES).find(
        pkg => pkg.productId === purchase.productId
      );
      
      if (!packageInfo) {
        throw new Error('Unknown product purchased');
      }

      // Sunucuda satın alma işlemini doğrula
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/purchase/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken || purchase.transactionReceipt,
          platform: Platform.OS,
          diamonds: packageInfo.diamonds
        })
      });

      if (response.ok) {
        // Elmasları kullanıcıya ver
        await DiamondService.addDiamonds(packageInfo.diamonds);
        
        // Satın alma işlemini tamamla
        await InAppPurchases.finishTransactionAsync(purchase, true);
        
        console.log(`Purchase processed: ${packageInfo.diamonds} diamonds added`);
        return true;
      } else {
        console.error('Purchase verification failed');
        return false;
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      return false;
    }
  },

  // Bekleyen satın almaları kontrol et
  async checkPendingPurchases() {
    try {
      const { results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      for (const purchase of results) {
        if (purchase.acknowledged === false) {
          await this.processPurchase(purchase);
        }
      }
    } catch (error) {
      console.error('Error checking pending purchases:', error);
    }
  },

  // Satın alma geçmişini al
  async getPurchaseHistory() {
    try {
      const { results, responseCode } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        return results;
      } else {
        console.error('Failed to get purchase history:', responseCode);
        return [];
      }
    } catch (error) {
      console.error('Error getting purchase history:', error);
      return [];
    }
  },

  // Satın almaları geri yükle
  async restorePurchases() {
    try {
      const { results, responseCode } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        let restoredCount = 0;
        
        for (const purchase of results) {
          const processed = await this.processPurchase(purchase);
          if (processed) {
            restoredCount++;
          }
        }
        
        return {
          success: true,
          restoredCount
        };
      } else {
        return {
          success: false,
          error: 'Satın almalar geri yüklenemedi'
        };
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return {
        success: false,
        error: 'Geri yükleme sırasında hata oluştu'
      };
    }
  },

  // Bağlantıyı kapat
  async disconnect() {
    try {
      await InAppPurchases.disconnectAsync();
    } catch (error) {
      console.error('Error disconnecting from in-app purchases:', error);
    }
  },

  // Elmas paketlerini al
  getDiamondPackages() {
    return DIAMOND_PACKAGES;
  },

  // Ürün ID'sinden paket bilgisini al
  getPackageByProductId(productId) {
    return Object.values(DIAMOND_PACKAGES).find(pkg => pkg.productId === productId);
  },

  // Test satın alma (development için)
  async testPurchase(packageKey) {
    if (__DEV__) {
      const packageInfo = DIAMOND_PACKAGES[packageKey];
      if (packageInfo) {
        await DiamondService.addDiamonds(packageInfo.diamonds);
        console.log(`Test purchase: ${packageInfo.diamonds} diamonds added`);
        return { success: true };
      }
    }
    return { success: false, error: 'Test purchase only available in development' };
  }
};