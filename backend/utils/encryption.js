const crypto = require('crypto');

// Environment variable'dan encryption key al
const ENCRYPTION_KEY = process.env.PHONE_ENCRYPTION_KEY || 'Ka14+Xm07Z6Wm+ZaDfqyAN/gV/xGcIWG';
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

// Key'i buffer'a çevir ve uzunluğunu kontrol et
function getKey() {
  const key = ENCRYPTION_KEY.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH);
  return Buffer.from(key, 'utf8');
}

/**
 * Telefon numarasını şifreler
 * @param {string} phoneNumber - Şifrelenecek telefon numarası
 * @returns {string} - Şifrelenmiş ve base64'e çevrilmiş veri
 */
function encryptPhoneNumber(phoneNumber) {
  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('Geçersiz telefon numarası');
    }

    // Telefon numarasını temizle (sadece rakamlar)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // IV (Initialization Vector) oluştur
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Cipher oluştur
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Şifrele
    let encrypted = cipher.update(cleanPhone, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // IV ve şifrelenmiş veriyi birleştir
    const result = {
      iv: iv.toString('hex'),
      data: encrypted
    };
    
    // Base64'e çevir
    return Buffer.from(JSON.stringify(result)).toString('base64');
  } catch (error) {
    console.error('Telefon şifreleme hatası:', error);
    throw new Error('Telefon numarası şifrelenemedi');
  }
}

/**
 * Şifrelenmiş telefon numarasını çözer
 * @param {string} encryptedData - Şifrelenmiş veri (base64)
 * @returns {string} - Çözülmüş telefon numarası
 */
function decryptPhoneNumber(encryptedData) {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Geçersiz şifrelenmiş veri');
    }

    // Eğer veri zaten düz telefon numarası gibi görünüyorsa, direkt döndür
    const cleanData = encryptedData.replace(/\s/g, '');
    if (/^\d+$/.test(cleanData) && cleanData.length >= 10 && cleanData.length <= 15) {
      return cleanData;
    }

    // Base64'ten çöz
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    
    // Gerekli alanları kontrol et
    if (!parsed.iv || !parsed.data) {
      throw new Error('Eksik şifreleme verisi');
    }
    
    // IV'yi buffer'a çevir
    const iv = Buffer.from(parsed.iv, 'hex');
    
    // Decipher oluştur
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Çöz
    let decrypted = decipher.update(parsed.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Telefon deşifreleme hatası:', error);
    // Eğer çözme başarısız olursa, orijinal veriyi düz telefon numarası olarak kabul et
    console.log('Orijinal veri telefon numarası olarak kabul ediliyor:', encryptedData);
    return encryptedData.replace(/\s/g, '');
  }
}

/**
 * Telefon numarasını maskeler (görsel amaçlı)
 * @param {string} phoneNumber - Maskelenecek telefon numarası
 * @returns {string} - Maskelenmiş telefon numarası
 */
function maskPhoneNumber(phoneNumber) {
  try {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return '***';
    }

    // Telefon numarasını temizle
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      return '***';
    }
    
    // Türk telefon formatı: +90 (5**) *** ** 34
    if (cleanPhone.startsWith('90')) {
      const last4 = cleanPhone.slice(-2);
      const first3 = cleanPhone.slice(2, 3);
      return `+90 (${first3}**) *** ** ${last4}`;
    }
    
    // Diğer formatlar için genel maskeleme
    const last2 = cleanPhone.slice(-2);
    const first2 = cleanPhone.slice(0, 2);
    return `${first2}***${last2}`;
  } catch (error) {
    console.error('Telefon maskeleme hatası:', error);
    return '***';
  }
}

/**
 * İki telefon numarasını güvenli şekilde karşılaştırır
 * @param {string} phone1 - İlk telefon numarası (düz veya şifreli)
 * @param {string} phone2 - İkinci telefon numarası (düz veya şifreli)
 * @returns {boolean} - Eşleşme durumu
 */
function comparePhoneNumbers(phone1, phone2) {
  try {
    let cleanPhone1, cleanPhone2;
    
    // İlk numarayı çöz
    cleanPhone1 = decryptPhoneNumber(phone1);
    
    // İkinci numarayı çöz
    cleanPhone2 = decryptPhoneNumber(phone2);
    
    return cleanPhone1 === cleanPhone2;
  } catch (error) {
    console.error('Telefon karşılaştırma hatası:', error);
    return false;
  }
}

module.exports = {
  encryptPhoneNumber,
  decryptPhoneNumber,
  maskPhoneNumber,
  comparePhoneNumbers
};