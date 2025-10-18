// Crash Handler - Global error ve exception yakalama
import Constants from 'expo-constants';

class CrashHandler {
  static initialize() {
    // Global error handler
    if (ErrorUtils) {
      const originalHandler = ErrorUtils.getGlobalHandler();
      
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.error('🚨 GLOBAL ERROR CAUGHT:', error);
        console.error('Fatal:', isFatal);
        console.error('Stack:', error.stack);
        
        // Crash log'larını AsyncStorage'e kaydet
        this.logCrash(error, isFatal);
        
        // Orijinal handler'ı çağır
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
    
    // Unhandled promise rejections
    if (typeof global !== 'undefined') {
      global.onunhandledrejection = (event) => {
        console.error('🚨 UNHANDLED PROMISE REJECTION:', event.reason);
        this.logCrash(event.reason, false);
      };
    }
    
    console.log('✅ Crash handler initialized');
  }
  
  static logCrash(error, isFatal) {
    try {
      const crashInfo = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message || 'Unknown error',
          stack: error.stack || 'No stack trace',
          name: error.name || 'Error'
        },
        isFatal: isFatal,
        appVersion: Constants.manifest?.version || 'unknown',
        platform: Constants.platform,
        deviceId: Constants.deviceId,
        sessionId: Math.random().toString(36).substr(2, 9)
      };
      
      console.log('📋 CRASH LOG:', JSON.stringify(crashInfo, null, 2));
      
      // AsyncStorage'e kaydet (debug için)
      if (__DEV__) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const existingLogs = AsyncStorage.getItem('crash_logs') || '[]';
        const logs = JSON.parse(existingLogs);
        logs.push(crashInfo);
        AsyncStorage.setItem('crash_logs', JSON.stringify(logs));
      }
    } catch (logError) {
      console.error('Failed to log crash:', logError);
    }
  }
  
  static async getCrashLogs() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const logs = await AsyncStorage.getItem('crash_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to get crash logs:', error);
      return [];
    }
  }
  
  static clearCrashLogs() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.removeItem('crash_logs');
    } catch (error) {
      console.error('Failed to clear crash logs:', error);
    }
  }
}

export default CrashHandler;