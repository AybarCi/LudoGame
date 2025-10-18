// Test Crash Handler - Debug için crash testleri
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

class TestCrashHandler {
  static showCrashTestMenu() {
    if (!__DEV__) return; // Sadece development modunda
    
    Alert.alert(
      'Test Crash Menu',
      'Bir crash testi seçin:',
      [
        { text: 'JavaScript Error', onPress: this.triggerJSError },
        { text: 'Promise Rejection', onPress: this.triggerPromiseRejection },
        { text: 'Native Crash', onPress: this.triggerNativeCrash },
        { text: 'Memory Crash', onPress: this.triggerMemoryCrash },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  }
  
  static triggerJSError() {
    throw new Error('Test JavaScript Error - This is intentional for testing crash handling');
  }
  
  static triggerPromiseRejection() {
    Promise.reject(new Error('Test Promise Rejection - This is intentional for testing'));
  }
  
  static triggerNativeCrash() {
    // Bu native bir crash tetikleyecektir
    const nullObject = null;
    nullObject.someMethod(); // This will crash
  }
  
  static triggerMemoryCrash() {
    // Memory leak simulation
    const arrays = [];
    while (true) {
      arrays.push(new Array(1000000).fill('x'));
    }
  }
  
  static logCurrentState() {
    console.log('=== CURRENT APP STATE ===');
    console.log('Platform:', Platform.OS);
    console.log('Version:', Constants.manifest?.version);
    console.log('Device:', Constants.deviceName);
    console.log('Memory:', global.performance?.memory);
    console.log('Connection:', navigator.connection);
    console.log('========================');
  }
}

// Debug için global erişim
if (__DEV__) {
  global.TestCrashHandler = TestCrashHandler;
}

export default TestCrashHandler;