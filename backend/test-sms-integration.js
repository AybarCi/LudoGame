#!/usr/bin/env node

/**
 * VatanSMS Entegrasyonu Test Scripti
 * Bu script VatanSMS API entegrasyonunu test eder
 */

require('dotenv').config();
const smsService = require('./services/sms-service');

console.log('🧪 VatanSMS Entegrasyonu Test Başlatılıyor...\n');

// Test parametreleri
const testPhoneNumber = '5551234567'; // Test telefon numarası
const testOtpCode = '123456'; // Test OTP kodu

async function testSMSService() {
    console.log('📋 Test Parametreleri:');
    console.log(`   📱 Telefon: ${testPhoneNumber}`);
    console.log(`   🔢 OTP Kod: ${testOtpCode}`);
    console.log(`   🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);

    // Environment variables kontrolü
    console.log('🔧 Environment Variables Kontrolü:');
    console.log(`   VATAN_SMS_API_ID: ${process.env.VATAN_SMS_API_ID ? '✅ Mevcut' : '❌ Eksik'}`);
    console.log(`   VATAN_SMS_API_KEY: ${process.env.VATAN_SMS_API_KEY ? '✅ Mevcut' : '❌ Eksik'}`);
    console.log(`   VATAN_SMS_SENDER: ${process.env.VATAN_SMS_SENDER ? '✅ Mevcut' : '❌ Eksik'}\n`);

    try {
        console.log('📤 SMS Gönderimi Test Ediliyor...');
        
        const result = await smsService.send(testPhoneNumber, testOtpCode);
        
        console.log('\n📊 Test Sonucu:');
        console.log(`   ✅ Başarı Durumu: ${result.success ? 'BAŞARILI' : 'BAŞARISIZ'}`);
        console.log(`   📝 Mesaj: ${result.message}`);
        
        if (result.success) {
            console.log(`   📋 API Yanıtı:`, result.data);
        } else {
            console.log(`   ❌ Hata:`, result.error);
        }

        console.log('\n🎯 Test Tamamlandı!');
        
        if (result.success) {
            console.log('✅ VatanSMS entegrasyonu çalışıyor!');
        } else {
            console.log('⚠️  SMS gönderimi başarısız - lütfen credentials ve API durumunu kontrol edin.');
        }

    } catch (error) {
        console.error('\n❌ Test Hatası:', error.message);
        console.error('🔍 Detay:', error);
    }
}

// Test fonksiyonlarını çalıştır
async function runAllTests() {
    console.log('=' .repeat(60));
    console.log('🚀 VatanSMS API Entegrasyonu Test Süreci');
    console.log('=' .repeat(60));
    
    await testSMSService();
    
    console.log('\n' + '=' .repeat(60));
    console.log('📋 Test Özeti:');
    console.log('   1. SMS Service modülü test edildi');
    console.log('   2. Environment variables kontrol edildi');
    console.log('   3. API bağlantısı test edildi');
    console.log('=' .repeat(60));
    
    console.log('\n💡 Sonraki Adımlar:');
    console.log('   1. Gerçek API credentials\'larını .env dosyasına ekleyin');
    console.log('   2. Production ortamında deployment/env.production dosyasını güncelleyin');
    console.log('   3. Frontend uygulamasından /api/send-sms-code endpoint\'ini test edin');
    console.log('   4. Gerçek telefon numarası ile SMS alımını doğrulayın\n');
}

// Script çalıştır
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testSMSService };