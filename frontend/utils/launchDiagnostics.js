// Launch Diagnostics - Uygulama açılırkenki crash'leri teşhis etme
import Constants from 'expo-constants';
import { Platform } from 'react-native';

class LaunchDiagnostics {
  static logStage(stage, data = {}) {
    const timestamp = new Date().toISOString();
    const diagnosticInfo = {
      timestamp,
      stage,
      data,
      platform: Platform.OS,
      version: Constants.manifest?.version,
      sdkVersion: Constants.manifest?.sdkVersion,
      deviceId: Constants.deviceId,
    };
    
    console.log(`🔍 LAUNCH DIAGNOSTICS [${stage}]:`, JSON.stringify(diagnosticInfo, null, 2));
    
    // AsyncStorage'e launch log'u kaydet
    if (__DEV__) {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const key = `launch_log_${Date.now()}`;
        AsyncStorage.setItem(key, JSON.stringify(diagnosticInfo));
      } catch (e) {
        console.error('Failed to save launch log:', e);
      }
    }
  }
  
  static checkCriticalResources() {
    const checks = [];
    
    // 1. Asset kontrolleri
    try {
      const logoImage = require('../assets/images/logo.png');
      checks.push({ type: 'asset', name: 'logo.png', status: 'ok' });
    } catch (error) {
      checks.push({ type: 'asset', name: 'logo.png', status: 'error', error: error.message });
    }
    
    // 2. Font kontrolleri
    try {
      const fonts = require('@expo-google-fonts/poppins');
      checks.push({ type: 'font', name: 'poppins', status: 'ok' });
    } catch (error) {
      checks.push({ type: 'font', name: 'poppins', status: 'error', error: error.message });
    }
    
    // 3. Store kontrolü
    try {
      const { store } = require('../store');
      checks.push({ type: 'store', name: 'redux-store', status: 'ok' });
    } catch (error) {
      checks.push({ type: 'store', name: 'redux-store', status: 'error', error: error.message });
    }
    
    // 4. Service kontrolleri
    try {
      require('../services/AdService');
      checks.push({ type: 'service', name: 'AdService', status: 'ok' });
    } catch (error) {
      checks.push({ type: 'service', name: 'AdService', status: 'error', error: error.message });
    }
    
    try {
      require('../services/PurchaseService');
      checks.push({ type: 'service', name: 'PurchaseService', status: 'ok' });
    } catch (error) {
      checks.push({ type: 'service', name: 'PurchaseService', status: 'error', error: error.message });
    }
    
    return checks;
  }
  
  static async getLaunchLogs() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const launchKeys = keys.filter(key => key.startsWith('launch_log_'));
      const logs = await AsyncStorage.multiGet(launchKeys);
      
      return logs.map(([key, value]) => JSON.parse(value)).sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
    } catch (error) {
      console.error('Failed to get launch logs:', error);
      return [];
    }
  }
  
  static clearLaunchLogs() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.getAllKeys().then(keys => {
        const launchKeys = keys.filter(key => key.startsWith('launch_log_'));
        AsyncStorage.multiRemove(launchKeys);
      });
    } catch (error) {
      console.error('Failed to clear launch logs:', error);
    }
  }
}

export default LaunchDiagnostics;