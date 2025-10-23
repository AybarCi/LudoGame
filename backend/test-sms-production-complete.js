#!/usr/bin/env node

/**
 * Production SMS Service Test Script
 * Bu script production ortamındaki SMS servisini test etmek için kullanılır
 */

require('dotenv').config({ path: '.env.production' });
const SMSService = require('./services/sms-service');

async function testSMSService() {
    console.log('🚀 Production SMS Service Test Başlatılıyor...\n');
    
    // Environment kontrolü
    console.log('📋 Environment Kontrolü:');
    console.log('   NODE_ENV:', process.env.NODE_ENV);
    console.log('   SMS_TEST_MODE:', process.env.SMS_TEST_MODE);
    console.log('   SMS_TIMEOUT:', process.env.SMS_TIMEOUT);
    console.log('   SMS_RETRY_COUNT:', process.env.SMS_RETRY_COUNT);
    console.log('   SMS_COOLDOWN_MS:', process.env.SMS_COOLDOWN_MS);
    console.log('   SMS_DAILY_LIMIT:', process.env.SMS_DAILY_LIMIT);
    console.log('   SMS_HOURLY_LIMIT:', process.env.SMS_HOURLY_LIMIT);
    console.log('   SMS_RATE_LIMIT_ENABLED:', process.env.SMS_RATE_LIMIT_ENABLED);
    console.log('');
    
    // API Credentials kontrolü
    console.log('🔑 API Credentials Kontrolü:');
    console.log('   VATAN_SMS_API_ID:', process.env.VATAN_SMS_API_ID ? '✅ Mevcut' : '❌ Eksik');
    console.log('   VATAN_SMS_API_KEY:', process.env.VATAN_SMS_API_KEY ? '✅ Mevcut' : '❌ Eksik');
    console.log('   VATAN_SMS_SENDER:', process.env.VATAN_SMS_SENDER ? '✅ Mevcut' : '❌ Eksik');
    console.log('');
    
    if (!process.env.VATAN_SMS_API_ID || !process.env.VATAN_SMS_API_KEY || !process.env.VATAN_SMS_SENDER) {
        console.error('❌ API Credentials eksik! Test durduruluyor.');
        process.exit(1);
    }
    
    // Test telefon numarası (gerçek bir numara olmalı)
    const testPhoneNumber = '5551234567'; // Burayı kendi test numaranızla değiştirin
    const testOTP = '123456';
    
    console.log('📱 SMS Testi:');
    console.log('   Telefon Numarası:', testPhoneNumber);
    console.log('   OTP Kodu:', testOTP);
    console.log('');
    
    try {
        // SMS gönderme testi
        console.log('⏳ SMS gönderiliyor...');
        const result = await SMSService.send(testPhoneNumber, testOTP);
        
        console.log('\n📊 Sonuç:');
        console.log('   Başarılı:', result.success ? '✅ Evet' : '❌ Hayır');
        console.log('   Mesaj:', result.message);
        
        if (result.success) {
            console.log('   API Yanıtı:', JSON.stringify(result.data, null, 2));
            
            if (result.rateLimit) {
                console.log('\n📈 Rate Limit Bilgisi:');
                console.log('   Günlük Limit:', result.rateLimit.daily.limit);
                console.log('   Günlük Kullanım:', result.rateLimit.daily.used);
                console.log('   Saatlik Limit:', result.rateLimit.hourly.limit);
                console.log('   Saatlik Kullanım:', result.rateLimit.hourly.used);
            }
        } else {
            console.log('   Hata:', result.error);
            if (result.details) {
                console.log('   Detaylar:', JSON.stringify(result.details, null, 2));
            }
        }
        
        // Rate limit testi
        console.log('\n🔄 Rate Limit Testi:');
        console.log('   Aynı numaraya 2. SMS gönderilmeye çalışılıyor...');
        
        const rateLimitResult = await SMSService.send(testPhoneNumber, '654321');
        console.log('   2. SMS Sonucu:', rateLimitResult.success ? '✅ Gönderildi' : '❌ Engellendi');
        if (!rateLimitResult.success) {
            console.log('   Engelleme Nedeni:', rateLimitResult.message);
        }
        
    } catch (error) {
        console.error('❌ Test sırasında hata oluştu:', error.message);
        console.error('   Stack:', error.stack);
        process.exit(1);
    }
    
    console.log('\n✅ SMS Service Testi Tamamlandı!');
}

// Test script'ini çalıştır
if (require.main === module) {
    testSMSService().catch(error => {
        console.error('❌ Test başarısız:', error);
        process.exit(1);
    });
}

module.exports = { testSMSService };