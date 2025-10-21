#!/usr/bin/env node

// Test SMS servisini production ortamı için kontrol et
require('dotenv').config();

const smsService = require('./services/sms-service');

async function testSMSService() {
    console.log('🔍 SMS Servisi Testi Başlatılıyor...');
    console.log('📋 Environment Bilgileri:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   VATAN_SMS_API_ID:', process.env.VATAN_SMS_API_ID ? '✅ Ayarlanmış' : '❌ Eksik');
    console.log('   VATAN_SMS_API_KEY:', process.env.VATAN_SMS_API_KEY ? '✅ Ayarlanmış' : '❌ Eksik');
    console.log('   VATAN_SMS_SENDER:', process.env.VATAN_SMS_SENDER ? '✅ Ayarlanmış' : '❌ Eksik');
    
    console.log('\n📱 Test SMS Gönderimi Deneniyor...');
    
    try {
        // Test telefon numarası (555 555 55 55)
        const testPhone = '5555555555';
        const testOTP = '123456';
        
        console.log(`   Hedef Numara: ${testPhone}`);
        console.log(`   OTP Kodu: ${testOTP}`);
        
        const result = await smsService.send(testPhone, testOTP);
        
        console.log('\n📊 Sonuç:');
        console.log('   Başarılı:', result.success);
        console.log('   Mesaj:', result.message);
        
        if (result.success) {
            console.log('   Detaylar:', JSON.stringify(result.data, null, 2));
        } else {
            console.log('   Hata:', result.error);
        }
        
    } catch (error) {
        console.error('❌ Test sırasında hata:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Testi çalıştır
testSMSService().then(() => {
    console.log('\n✅ SMS Servisi Testi Tamamlandı');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test başarısız:', error);
    process.exit(1);
});