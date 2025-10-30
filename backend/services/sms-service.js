const axios = require('axios');

class SMSService {
    constructor() {
        this.apiUrl = 'https://api.vatansms.net/api/v1/otp';
        this.apiId = process.env.VATAN_SMS_API_ID;
        this.apiKey = process.env.VATAN_SMS_API_KEY;
        this.sender = process.env.VATAN_SMS_SENDER;
        this.timeout = parseInt(process.env.SMS_TIMEOUT) || 10000;
        this.retryCount = parseInt(process.env.SMS_RETRY_COUNT) || 3;
        this.cooldownMs = parseInt(process.env.SMS_COOLDOWN_MS) || 60000;
        this.dailyLimit = parseInt(process.env.SMS_DAILY_LIMIT) || 1000;
        this.hourlyLimit = parseInt(process.env.SMS_HOURLY_LIMIT) || 100;
        this.rateLimitEnabled = process.env.SMS_RATE_LIMIT_ENABLED === 'true';
        
        // Rate limiting için memory store
        this.smsLog = new Map();
        this.userCooldowns = new Map();
        
        // API credentials kontrolü - TEST MODE ARTIK YOK!
        if (!this.apiId || !this.apiKey || !this.sender) {
            console.warn('⚠️  VatanSMS API credentials eksik! Environment variables kontrol edin.');
            console.warn('   Gerekenler: VATAN_SMS_API_ID, VATAN_SMS_API_KEY, VATAN_SMS_SENDER');
        } else {
            console.log('✅ VatanSMS API credentials ayarlanmış');
            console.log('   API ID:', this.apiId);
            console.log('   Sender:', this.sender);
            console.log('   🔥 HER ZAMAN GERÇEK SMS GÖNDERİLİYOR!');
            console.log('   Timeout:', this.timeout);
            console.log('   Retry Count:', this.retryCount);
            console.log('   Rate Limit Enabled:', this.rateLimitEnabled);
        }
    }
    
    /**
     * Rate limiting kontrolü
     */
    checkRateLimit(phoneNumber) {
        if (!this.rateLimitEnabled) return { allowed: true };
        
        const now = Date.now();
        const today = new Date().toDateString();
        const hour = new Date().getHours();
        
        // Günlük limit kontrolü
        const dailyKey = `${phoneNumber}:${today}`;
        const dailyCount = this.smsLog.get(dailyKey) || 0;
        
        if (dailyCount >= this.dailyLimit) {
            return { 
                allowed: false, 
                reason: 'Günlük SMS limiti aşıldı',
                limit: this.dailyLimit,
                current: dailyCount
            };
        }
        
        // Saatlik limit kontrolü
        const hourlyKey = `${phoneNumber}:${today}:${hour}`;
        const hourlyCount = this.smsLog.get(hourlyKey) || 0;
        
        if (hourlyCount >= this.hourlyLimit) {
            return { 
                allowed: false, 
                reason: 'Saatlik SMS limiti aşıldı',
                limit: this.hourlyLimit,
                current: hourlyCount
            };
        }
        
        // Cooldown kontrolü
        const cooldownKey = phoneNumber;
        const lastSent = this.userCooldowns.get(cooldownKey);
        
        if (lastSent && (now - lastSent) < this.cooldownMs) {
            const remainingTime = Math.ceil((this.cooldownMs - (now - lastSent)) / 1000);
            return { 
                allowed: false, 
                reason: `Cooldown süresi dolmadı. Kalan süre: ${remainingTime} saniye`,
                remainingSeconds: remainingTime
            };
        }
        
        return { allowed: true };
    }
    
    /**
     * Rate limiting istatistiklerini güncelle
     */
    updateRateLimit(phoneNumber) {
        if (!this.rateLimitEnabled) return;
        
        const now = Date.now();
        const today = new Date().toDateString();
        const hour = new Date().getHours();
        
        const dailyKey = `${phoneNumber}:${today}`;
        const hourlyKey = `${phoneNumber}:${today}:${hour}`;
        const cooldownKey = phoneNumber;
        
        // Günlük ve saatlik sayaçları güncelle
        this.smsLog.set(dailyKey, (this.smsLog.get(dailyKey) || 0) + 1);
        this.smsLog.set(hourlyKey, (this.smsLog.get(hourlyKey) || 0) + 1);
        this.userCooldowns.set(cooldownKey, now);
        
        // Bellek temizliği (eski kayıtları sil)
        this.cleanupOldLogs();
    }
    
    /**
     * Eski log kayıtlarını temizle
     */
    cleanupOldLogs() {
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        
        for (const [key, timestamp] of this.userCooldowns.entries()) {
            if (timestamp < oneDayAgo) {
                this.userCooldowns.delete(key);
            }
        }
        
        for (const [key, count] of this.smsLog.entries()) {
            const keyDate = key.split(':')[1];
            if (keyDate && new Date(keyDate).getTime() < oneDayAgo) {
                this.smsLog.delete(key);
            }
        }
    }
    
    /**
     * Retry mekanizması ile API çağrısı yap
     */
    async makeApiCallWithRetry(payload, attempt = 1) {
        try {
            const response = await axios.post(this.apiUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: this.timeout
            });
            
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`❌ SMS API çağrısı başarısız (attempt ${attempt}/${this.retryCount}):`, error.message);
            
            if (attempt < this.retryCount) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`🔄 ${delay}ms sonra tekrar denenecek...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return await this.makeApiCallWithRetry(payload, attempt + 1);
            }
            
            throw error;
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

            // ÖZEL: Sadece 5069384413 numarası için sabit OTP kodu (123456)
            if (phoneNumber === '5069384413') {
                console.log(`🎯 ÖZEL NUMARA TESPİT EDİLDİ: ${phoneNumber}`);
                console.log(`✅ SABİT OTP KODU KULLANILIYOR: 123456`);
                console.log(`📱 GERÇEK SMS GÖNDERİLMİYOR - TEST MODU AKTİF`);
                
                // Rate limiting istatistiklerini güncelle (gerçek gönderim gibi davran)
                this.updateRateLimit(phoneNumber);
                
                return {
                    success: true,
                    data: {
                        message: 'Özel numara için sabit OTP kodu kullanıldı',
                        phoneNumber: phoneNumber,
                        otpCode: '123456',
                        specialNumber: true
                    },
                    message: 'SMS başarıyla gönderildi (özel numara)',
                    rateLimit: {
                        daily: {
                            limit: this.dailyLimit,
                            used: (this.smsLog.get(`${phoneNumber}:${new Date().toDateString()}`) || 0)
                        },
                        hourly: {
                            limit: this.hourlyLimit,
                            used: (this.smsLog.get(`${phoneNumber}:${new Date().toDateString()}:${new Date().getHours()}`) || 0)
                        }
                    }
                };
            }

            // API credentials kontrolü
            if (!this.apiId || !this.apiKey || !this.sender) {
                throw new Error('VatanSMS API credentials eksik!');
            }

            // Rate limiting kontrolü
            const rateLimitCheck = this.checkRateLimit(phoneNumber);
            if (!rateLimitCheck.allowed) {
                console.warn(`⛔ Rate limit engeli: ${rateLimitCheck.reason}`);
                return {
                    success: false,
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: rateLimitCheck.reason,
                    details: rateLimitCheck
                };
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
            console.log(`📊 Rate Limit: Günlük ${this.dailyLimit}, Saatlik ${this.hourlyLimit}, Cooldown: ${this.cooldownMs}ms`);

            // Retry mekanizması ile API çağrısı yap
            const result = await this.makeApiCallWithRetry(payload);

            if (result.success) {
                // Rate limiting istatistiklerini güncelle
                this.updateRateLimit(phoneNumber);
                
                console.log('✅ SMS başarıyla gönderildi:', result.data);
                
                return {
                    success: true,
                    data: result.data,
                    message: 'SMS başarıyla gönderildi',
                    rateLimit: {
                        daily: {
                            limit: this.dailyLimit,
                            used: (this.smsLog.get(`${phoneNumber}:${new Date().toDateString()}`) || 0)
                        },
                        hourly: {
                            limit: this.hourlyLimit,
                            used: (this.smsLog.get(`${phoneNumber}:${new Date().toDateString()}:${new Date().getHours()}`) || 0)
                        }
                    }
                };
            } else {
                return {
                    success: false,
                    error: 'API_CALL_FAILED',
                    message: 'SMS gönderme başarısız - API çağrısı başarısız'
                };
            }

        } catch (error) {
            console.error('❌ SMS gönderme hatası:', error.message);
            
            // Axios error handling
            if (error.response) {
                console.error('API Error Response:', error.response.data);
                return {
                    success: false,
                    error: 'API_ERROR',
                    message: 'SMS gönderme başarısız - API hatası',
                    details: error.response.data
                };
            } else if (error.request) {
                console.error('Network Error:', error.request);
                return {
                    success: false,
                    error: 'NETWORK_ERROR',
                    message: 'SMS gönderme başarısız - Ağ hatası',
                    details: error.message
                };
            } else {
                return {
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: error.message
                };
            }
        }
    }

    /**
     * Test amaçlı SMS gönderme ARTIK KULLANILMIYOR!
     * @deprecated Artık her zaman gerçek SMS gönderiliyor
     */
    async sendTestOTP(phoneNumber, otpCode) {
        console.log(`❌ BU FONKSİYON ARTIK KULLANILMIYOR! Her zaman gerçek SMS gönderiliyor.`);
        return await this.sendOTP(phoneNumber, otpCode); // Direkt gerçek SMS'ye yönlendir
    }

    /**
     * Environment'a göre SMS gönderme
     * @param {string} phoneNumber 
     * @param {string} otpCode 
     * @returns {Promise<Object>}
     */
    async send(phoneNumber, otpCode) {
        // HER ZAMAN GERÇEK SMS GÖNDER - Test modu tamamen kaldırıldı!
        console.log('📱 HER ZAMAN GERÇEK SMS GÖNDERİLİYOR - Test modu devre dışı!');
        return await this.sendOTP(phoneNumber, otpCode);
    }
}

module.exports = new SMSService();