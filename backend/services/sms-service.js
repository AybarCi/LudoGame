const axios = require('axios');

class SMSService {
    constructor() {
        this.apiUrl = 'https://api.vatansms.net/api/v1/otp';
        this.apiId = process.env.VATAN_SMS_API_ID;
        this.apiKey = process.env.VATAN_SMS_API_KEY;
        this.sender = process.env.VATAN_SMS_SENDER;
        
        // API credentials kontrolü
        if (!this.apiId || !this.apiKey || !this.sender) {
            console.warn('⚠️  VatanSMS API credentials eksik! Environment variables kontrol edin.');
        }
    }

    /**
     * VatanSMS API üzerinden OTP SMS gönderir
     * @param {string} phoneNumber - Telefon numarası (5xxxxxxxxx formatında)
     * @param {string} otpCode - 6 haneli OTP kodu
     * @returns {Promise<Object>} API yanıtı
     */
    async sendOTP(phoneNumber, otpCode) {
        try {
            // Telefon numarası formatını kontrol et
            if (!phoneNumber || !phoneNumber.match(/^5[0-9]{9}$/)) {
                throw new Error('Geçersiz telefon numarası formatı. 5xxxxxxxxx formatında olmalı.');
            }

            // OTP kodu kontrolü
            if (!otpCode || otpCode.length !== 6) {
                throw new Error('OTP kodu 6 haneli olmalı.');
            }

            // API credentials kontrolü
            if (!this.apiId || !this.apiKey || !this.sender) {
                throw new Error('VatanSMS API credentials eksik!');
            }

            // Mesaj template'i
            const message = `Ludo Turco doğrulama kodunuz: ${otpCode}. Bu kod 10 dakika geçerlidir. Güvenliğiniz için kimseyle paylaşmayın.`;

            // VatanSMS API request payload
            const payload = {
                api_id: this.apiId,
                api_key: this.apiKey,
                sender: this.sender,
                message_type: 'turkce',
                message: message,
                phones: [phoneNumber]
            };

            console.log(`📱 SMS gönderiliyor: ${phoneNumber} -> OTP: ${otpCode}`);

            // VatanSMS API'ye POST request
            const response = await axios.post(this.apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 saniye timeout
            });

            console.log('✅ SMS başarıyla gönderildi:', response.data);

            return {
                success: true,
                data: response.data,
                message: 'SMS başarıyla gönderildi'
            };

        } catch (error) {
            console.error('❌ SMS gönderme hatası:', error.message);
            
            // Axios error handling
            if (error.response) {
                console.error('API Error Response:', error.response.data);
                return {
                    success: false,
                    error: error.response.data,
                    message: 'SMS gönderme başarısız - API hatası'
                };
            } else if (error.request) {
                console.error('Network Error:', error.request);
                return {
                    success: false,
                    error: 'Network error',
                    message: 'SMS gönderme başarısız - Ağ hatası'
                };
            } else {
                return {
                    success: false,
                    error: error.message,
                    message: 'SMS gönderme başarısız'
                };
            }
        }
    }

    /**
     * Test amaçlı SMS gönderme (development environment)
     * @param {string} phoneNumber 
     * @param {string} otpCode 
     * @returns {Promise<Object>}
     */
    async sendTestOTP(phoneNumber, otpCode) {
        console.log(`🧪 TEST MODE - SMS gönderildi: ${phoneNumber} -> OTP: ${otpCode}`);
        console.log(`📝 Mesaj: Ludo Turco doğrulama kodunuz: ${otpCode}. Bu kod 10 dakika geçerlidir.`);
        
        return {
            success: true,
            data: { test_mode: true },
            message: 'Test SMS başarıyla gönderildi (konsol)'
        };
    }

    /**
     * Environment'a göre SMS gönderme
     * @param {string} phoneNumber 
     * @param {string} otpCode 
     * @returns {Promise<Object>}
     */
    async send(phoneNumber, otpCode) {
        // Development environment'ta test mode kullan
        if (process.env.NODE_ENV === 'development' || !this.apiId) {
            return await this.sendTestOTP(phoneNumber, otpCode);
        }
        
        // Production'da gerçek SMS gönder
        return await this.sendOTP(phoneNumber, otpCode);
    }
}

module.exports = new SMSService();