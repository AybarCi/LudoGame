const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// IP bazlı genel rate limiting - 15 dakikada 3 SMS
const generalSmsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 3, // Her IP için maksimum 3 istek
    message: {
        error: 'Çok fazla SMS isteği gönderildi.',
        message: 'Güvenliğiniz için 15 dakika sonra tekrar deneyin.',
        retryAfter: 15 * 60
    },
    standardHeaders: true, // Rate limit bilgilerini header'larda göster
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    skipSuccessfulRequests: true, // Başarılı istekler limit sayılmaz
    skipFailedRequests: false, // Başarısız istekler limit sayılır
    handler: (req, res) => {
        res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Çok fazla SMS isteği gönderildi. Lütfen 15 dakika sonra tekrar deneyin.',
            retryAfter: 15 * 60,
            retryAfterMinutes: 15
        });
    }
});

// Telefon numarası başına rate limiting - 1 saatte 5 SMS
const phoneNumberLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 5, // Her telefon numarası için saatte 5 SMS
    keyGenerator: (req) => {
        const phoneNumber = req.body.phoneNumber ? req.body.phoneNumber.replace(/\s/g, '') : '';
        return `phone:${phoneNumber}`;
    },
    message: {
        error: 'TELEFON_LIMIT_ASIMI',
        message: 'Bu telefon numarasına çok fazla SMS gönderildi.',
        retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Başarılı istekler limit sayılmaz (sliding window)
    skipFailedRequests: false, // Başarısız istekler limit sayılır
    handler: (req, res) => {
        res.status(429).json({
            error: 'PHONE_RATE_LIMIT_EXCEEDED',
            message: 'Bu telefon numarasına çok fazla SMS gönderildi. Lütfen 1 saat sonra tekrar deneyin.',
            retryAfter: 60 * 60,
            retryAfterMinutes: 60
        });
    }
});

// IP başına günlük farklı telefon numarası limiti - 24 saatte 20 farklı numara
const ipDailyPhoneLimit = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 saat
    max: 20, // Her IP için günlük 20 farklı telefon numarası
    keyGenerator: (req) => `phone_limit:${ipKeyGenerator(req)}:${req.body.phoneNumber}`,
    message: {
        error: 'GUNLUK_LIMIT_ASIMI',
        message: 'Günlük SMS limiti aşıldı.',
        retryAfter: 24 * 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'DAILY_PHONE_LIMIT_EXCEEDED',
            message: 'Günlük SMS limitiniz doldu. Lütfen yarın tekrar deneyin.',
            retryAfter: 24 * 60 * 60,
            retryAfterHours: 24
        });
    }
});

// Doğrulama endpoint'i için rate limiting - 15 dakikada 10 deneme
const verificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 10, // Her IP için 10 doğrulama denemesi
    message: {
        error: 'DOGULAMA_LIMIT_ASIMI',
        message: 'Çok fazla doğrulama denemesi yapıldı.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'VERIFICATION_RATE_LIMIT_EXCEEDED',
            message: 'Çok fazla doğrulama denemesi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.',
            retryAfter: 15 * 60,
            retryAfterMinutes: 15
        });
    }
});

module.exports = {
    generalSmsLimiter,
    phoneNumberLimiter,
    ipDailyPhoneLimit,
    verificationLimiter
};