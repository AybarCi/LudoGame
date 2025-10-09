// Test script for AdService functionality
const { AdService } = require('./services/AdService');
const { Platform } = require('react-native');
const Constants = require('expo-constants');

async function testAdService() {
  console.log('🧪 Testing AdService...');
  
  // Check environment
  console.log('📱 Platform:', Platform.OS);
  console.log('🔧 Constants.isDevice:', Constants.isDevice);
  console.log('🌍 __DEV__:', __DEV__);
  
  // Check if we're in a test environment
  const isRealDevice = Platform.OS !== 'web' && Constants.isDevice === true;
  console.log('✅ isRealDevice:', isRealDevice);
  
  if (!isRealDevice) {
    console.log('⚠️  Not a real device or web environment. Ads will be skipped.');
    console.log('📱 For real ads, test on a physical device.');
    return;
  }
  
  try {
    // Test ad initialization
    console.log('🔄 Initializing AdService...');
    await AdService.initialize();
    
    // Test rewarded ad readiness
    console.log('🔍 Checking rewarded ad readiness...');
    const isRewardedReady = await AdService.isRewardedReady();
    console.log('📺 Rewarded ad ready:', isRewardedReady);
    
    // Test interstitial ad readiness
    console.log('🔍 Checking interstitial ad readiness...');
    const isInterstitialReady = await AdService.isInterstitialReady();
    console.log('📺 Interstitial ad ready:', isInterstitialReady);
    
    // Test rewarded ad display (in test environment)
    if (__DEV__) {
      console.log('🎬 Testing rewarded ad display...');
      const adResult = await AdService.showRewardedAd();
      console.log('📊 Ad result:', adResult);
      
      if (adResult.userDidWatchAd) {
        console.log('✅ User watched the ad successfully!');
      } else {
        console.log('❌ Ad was not completed or failed.');
      }
    }
    
    console.log('✅ AdService test completed!');
    
  } catch (error) {
    console.error('❌ AdService test failed:', error);
  }
}

// Run the test
testAdService().catch(console.error);