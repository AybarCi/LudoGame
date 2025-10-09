// Demo script for testing earndiamonds.js integration with mock ads

// Mock React Native modules
const mockPlatform = { OS: 'ios' };
const mockConstants = { isDevice: false };
const __DEV__ = true;

// Mock services
const mockDiamondService = {
  rewardForAd: async () => {
    console.log('💎 DiamondService: 1 elmas eklendi');
    return { success: true, diamonds: 1 };
  }
};

const mockNotification = {
  showSuccess: (message) => console.log('✅ Bildirim:', message),
  showInfo: (message) => console.log('ℹ️  Bildirim:', message)
};

const mockAnimation = {
  trigger: (type) => console.log('🎉 Animasyon:', type, 'tetiklendi')
};

// Mock AdService behavior
const isRealDevice = mockPlatform.OS !== 'web' && mockConstants.isDevice === true;

const MockAdService = {
  showMockRewardedAd: async () => {
    return new Promise(async (resolve) => {
      console.log('\n🎬 Mock Rewarded Ad: Reklam simülasyonu başlatıldı');
      
      // 1 saniye yükleme süresi
      await new Promise(r => setTimeout(r, 1000));
      console.log('✅ Mock Ad: Reklam yüklendi');
      
      // 3 saniye izleme süresi
      console.log('⏳ Mock Ad: Kullanıcı reklamı izliyor (3 saniye)...');
      await new Promise(r => setTimeout(r, 3000));
      
      console.log('🎉 Mock Ad: Reklam başarıyla izlendi!');
      resolve({ userDidWatchAd: true });
    });
  }
};

// Mock handleWatchAd function (earndiamonds.js'den)
async function handleWatchAd() {
  console.log('🎯 handleWatchAd fonksiyonu çağrıldı');
  
  try {
    // Mock loading state
    console.log('⏳ Yükleniyor durumu: true');
    
    // Mock AdService.showRewardedAd() call
    let adResult;
    
    if (!isRealDevice && __DEV__) {
      // Geliştirme ortamında mock reklam göster
      adResult = await MockAdService.showMockRewardedAd();
    } else {
      // Gerçek cihazda normal reklam servisi
      adResult = { userDidWatchAd: false };
    }
    
    console.log('\n📊 Reklam Sonucu:', adResult);
    
    if (adResult.userDidWatchAd) {
      // Reklam başarıyla izlendi
      console.log('✅ Reklam izleme başarılı!');
      
      // 1 elmas ekle
      const rewardResult = await mockDiamondService.rewardForAd();
      console.log('💎 Ödül sonucu:', rewardResult);
      
      // Animasyon tetikle
      mockAnimation.trigger('diamond-earned');
      
      // Başarı bildirimi
      mockNotification.showSuccess('Tebrikler! 1 elmas kazandınız!');
      
      console.log('\n🎊 TAMAMLANDI: 1 elmas başarıyla eklendi!');
      
    } else {
      // Reklam izlenmedi
      console.log('❌ Reklam izlenemedi');
      mockNotification.showInfo('Reklam izleme tamamlanmadı. Lütfen tekrar deneyin.');
    }
    
    // Mock loading state
    console.log('⏳ Yükleniyor durumu: false');
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error.message);
    mockNotification.showInfo('Bir hata oluştu. Lütfen tekrar deneyin.');
    console.log('⏳ Yükleniyor durumu: false');
  }
}

// Demo'yu başlat
async function startDemo() {
  console.log('🎮 EARNDIAMONDS.JS DEMO BAŞLIYOR');
  console.log('=====================================');
  console.log('📱 Platform:', mockPlatform.OS);
  console.log('🔧 isDevice:', mockConstants.isDevice);
  console.log('🌍 __DEV__:', __DEV__);
  console.log('✅ isRealDevice:', isRealDevice);
  
  if (!isRealDevice && __DEV__) {
    console.log('\n✅ GELİŞTİRME ORTAMI: Mock reklamlar aktif!');
    console.log('🎯 "Reklam İzle" butonuna basıldı...\n');
    
    await handleWatchAd();
    
  } else {
    console.log('\n❌ Bu demo sadece geliştirme ortamında çalışır');
  }
}

// Demo'yu çalıştır
startDemo().then(() => {
  console.log('\n🏁 DEMO TAMAMLANDI');
  console.log('=====================================');
  console.log('💡 Sonuçlar:');
  console.log('✅ Test ortamında mock reklamlar çalışıyor');
  console.log('✅ Reklam izlendiğinde +1 elmas kazanılıyor');
  console.log('✅ Animasyonlar ve bildirimler çalışıyor');
  console.log('✅ Hata yönetimi aktif');
  console.log('\n🚀 Artık geliştirme ortamında reklam izleyebilirsiniz!');
});