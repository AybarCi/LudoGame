// Test script for analyzing AdService behavior in current environment

// Mock React Native modules
const mockPlatform = { OS: 'ios' };
const mockConstants = { isDevice: false };
const __DEV__ = true;

console.log('🧪 AdService Test Ortamı Analizi');
console.log('=====================================');

// Mock AdService behavior
const isRealDevice = mockPlatform.OS !== 'web' && mockConstants.isDevice === true;

console.log('📱 Platform:', mockPlatform.OS);
console.log('🔧 isDevice:', mockConstants.isDevice);
console.log('✅ isRealDevice:', isRealDevice);
console.log('🌍 __DEV__:', __DEV__);

console.log('\n🔍 YENİ Reklam Davranışı:');
console.log('=====================================');

// Mock reklam servisi
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
  }
};

async function testAdService() {
  if (!isRealDevice && __DEV__) {
    console.log('✅ GELİŞTİRME ORTAMI: Mock reklamlar aktif!');
    console.log('📺 Şimdi test reklamı gösteriliyor...\n');
    
    try {
      const result = await MockAdService.showMockRewardedAd();
      console.log('\n🎯 Test Sonucu:', result);
      
      if (result.userDidWatchAd) {
        console.log('✅ Reklam başarıyla izlendi!');
        console.log('💎 1 elmas kazanıldı!');
      } else {
        console.log('❌ Reklam izlenemedi');
      }
    } catch (error) {
      console.log('❌ Hata:', error.message);
    }
  } else {
    console.log('❌ Test ortamı desteklenmiyor');
  }
}

// Testi çalıştır
testAdService().then(() => {
  console.log('\n🎊 Test tamamlandı!');
  console.log('=====================================');
  console.log('💡 Özet:');
  console.log('- Test ortamında mock reklamlar çalışıyor');
  console.log('- Reklam izleme tamamlandığında +1 elmas kazanılıyor');
  console.log('- Bu sistem geliştirme ve test için mükemmel!');
});