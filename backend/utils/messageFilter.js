// Küfür ve hakaret filtreleme sistemi

const PROFANITY_WORDS = [
  // Türkçe küfürler ve hakaretler
  'amk', 'amq', 'aq', 'mk', 'oç', 'oc', 'sg', 'siktir', 'siktr', 'sktr',
  'aptal', 'salak', 'gerizekalı', 'mal', 'dangalak', 'ahmak', 'budala',
  'pislik', 'çöp', 'rezil', 'şerefsiz', 'namussuz', 'alçak', 'hain',
  'köpek', 'domuz', 'eşek', 'katır', 'hayvan', 'canavar', 'ucube',
  'geri zekalı', 'beyin yoksunu', 'kafasız', 'akılsız', 'cahil',
  'göt', 'got', 'kıç', 'kic', 'yarrak', 'sik', 'am', 'amcık', 'amcik',
  'orospu', 'kahpe', 'sürtük', 'fahişe', 'pezevenk', 'piç', 'pic',
  'ibne', 'gay', 'lezbiyen', 'travesti', 'trans',
  'ananı', 'anani', 'babanı', 'babani', 'karını', 'karini',
  'götünü', 'gotunu', 'kıçını', 'kicini', 'sikeyim', 'sikim',
  
  // İngilizce küfürler
  'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap',
  'stupid', 'idiot', 'moron', 'retard', 'dumb', 'loser', 'freak',
  'gay', 'fag', 'nigger', 'whore', 'slut', 'pussy', 'dick', 'cock',
  'penis', 'vagina', 'sex', 'porn', 'xxx', 'nude', 'naked'
];

const SEVERITY_LEVELS = {
  LOW: 1,    // Hafif hakaret
  MEDIUM: 2, // Orta seviye küfür
  HIGH: 3    // Ağır küfür/hakaret
};

const WORD_SEVERITY = {
  // Hafif hakaretler
  'aptal': SEVERITY_LEVELS.LOW,
  'salak': SEVERITY_LEVELS.LOW,
  'mal': SEVERITY_LEVELS.LOW,
  'ahmak': SEVERITY_LEVELS.LOW,
  'budala': SEVERITY_LEVELS.LOW,
  'stupid': SEVERITY_LEVELS.LOW,
  'idiot': SEVERITY_LEVELS.LOW,
  'dumb': SEVERITY_LEVELS.LOW,
  
  // Orta seviye
  'gerizekalı': SEVERITY_LEVELS.MEDIUM,
  'dangalak': SEVERITY_LEVELS.MEDIUM,
  'pislik': SEVERITY_LEVELS.MEDIUM,
  'çöp': SEVERITY_LEVELS.MEDIUM,
  'köpek': SEVERITY_LEVELS.MEDIUM,
  'eşek': SEVERITY_LEVELS.MEDIUM,
  'moron': SEVERITY_LEVELS.MEDIUM,
  'retard': SEVERITY_LEVELS.MEDIUM,
  'loser': SEVERITY_LEVELS.MEDIUM,
  
  // Ağır küfürler
  'amk': SEVERITY_LEVELS.HIGH,
  'oç': SEVERITY_LEVELS.HIGH,
  'siktir': SEVERITY_LEVELS.HIGH,
  'şerefsiz': SEVERITY_LEVELS.HIGH,
  'namussuz': SEVERITY_LEVELS.HIGH,
  'orospu': SEVERITY_LEVELS.HIGH,
  'piç': SEVERITY_LEVELS.HIGH,
  'fuck': SEVERITY_LEVELS.HIGH,
  'bitch': SEVERITY_LEVELS.HIGH,
  'asshole': SEVERITY_LEVELS.HIGH
};

// Karakterlerin benzer görünenleri ile değiştirilmesi
const CHARACTER_REPLACEMENTS = {
  '4': 'a', '@': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '5': 's',
  '7': 't', '+': 't', '8': 'b', '6': 'g', '9': 'g', '$': 's', 'ç': 'c',
  'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u'
};

/**
 * Metni normalize eder (küçük harf, özel karakterleri temizler)
 * @param {string} text - Normalize edilecek metin
 * @returns {string} Normalize edilmiş metin
 */
function normalizeText(text) {
  let normalized = text.toLowerCase();
  
  // Özel karakterleri değiştir
  for (const [char, replacement] of Object.entries(CHARACTER_REPLACEMENTS)) {
    // Regex özel karakterlerini escape et
    const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    normalized = normalized.replace(new RegExp(escapedChar, 'g'), replacement);
  }
  
  // Boşlukları ve noktalama işaretlerini kaldır
  normalized = normalized.replace(/[^a-zA-ZçğıöşüÇĞIÖŞÜ]/g, '');
  
  return normalized;
}

/**
 * Metinde küfür/hakaret arar
 * @param {string} text - Kontrol edilecek metin
 * @returns {Object} Filtreleme sonucu
 */
function checkProfanity(text) {
  const normalizedText = normalizeText(text);
  const foundWords = [];
  let maxSeverity = 0;
  
  // Her küfür kelimesini kontrol et
  for (const word of PROFANITY_WORDS) {
    const normalizedWord = normalizeText(word);
    
    // Tam kelime eşleşmesi
    if (normalizedText.includes(normalizedWord)) {
      const severity = WORD_SEVERITY[word] || SEVERITY_LEVELS.MEDIUM;
      foundWords.push({ word, severity });
      maxSeverity = Math.max(maxSeverity, severity);
    }
  }
  
  return {
    hasProfanity: foundWords.length > 0,
    foundWords,
    severity: maxSeverity,
    originalText: text
  };
}

/**
 * Metni filtreler ve küfürleri yıldızla değiştirir
 * @param {string} text - Filtrelenecek metin
 * @returns {string} Filtrelenmiş metin
 */
function filterProfanity(text) {
  let filteredText = text;
  
  for (const word of PROFANITY_WORDS) {
    const regex = new RegExp(word, 'gi');
    const replacement = '*'.repeat(word.length);
    filteredText = filteredText.replace(regex, replacement);
  }
  
  return filteredText;
}

/**
 * Kullanıcının küfür geçmişini takip eder
 */
class UserProfanityTracker {
  constructor() {
    this.userViolations = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000 * 60); // Her saat temizle
  }
  
  /**
 * Kullanıcının ihlalini kaydeder
 * @param {string} userId - Kullanıcı ID'si
 * @param {number} severity - İhlal şiddeti
 */
  recordViolation(userId, severity) {
    if (!this.userViolations.has(userId)) {
      this.userViolations.set(userId, {
        violations: [],
        totalScore: 0,
        lastViolation: Date.now()
      });
    }
    
    const userRecord = this.userViolations.get(userId);
    userRecord.violations.push({
      severity,
      timestamp: Date.now()
    });
    userRecord.totalScore += severity;
    userRecord.lastViolation = Date.now();
    
    // Son 24 saat içindeki ihlalleri tut
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    userRecord.violations = userRecord.violations.filter(v => v.timestamp > oneDayAgo);
    userRecord.totalScore = userRecord.violations.reduce((sum, v) => sum + v.severity, 0);
  }
  
  /**
   * Kullanıcının ceza durumunu kontrol eder
   * @param {string} userId - Kullanıcı ID'si
   * @returns {Object} Ceza durumu
   */
  checkPenalty(userId) {
    const userRecord = this.userViolations.get(userId);
    if (!userRecord) {
      return { shouldBlock: false, reason: null };
    }
    
    const { totalScore, violations } = userRecord;
    
    // Ağır ceza: 10+ puan veya 5+ ihlal
    if (totalScore >= 10 || violations.length >= 5) {
      return {
        shouldBlock: true,
        reason: 'Çok fazla küfür/hakaret kullandınız. Mesaj gönderme hakkınız geçici olarak kısıtlandı.',
        duration: 30 * 60 * 1000 // 30 dakika
      };
    }
    
    // Orta ceza: 6-9 puan veya 3-4 ihlal
    if (totalScore >= 6 || violations.length >= 3) {
      return {
        shouldBlock: true,
        reason: 'Küfür/hakaret kullanımı tespit edildi. Lütfen nezaket kurallarına uyun.',
        duration: 10 * 60 * 1000 // 10 dakika
      };
    }
    
    return { shouldBlock: false, reason: null };
  }
  
  /**
   * Eski kayıtları temizler
   */
  cleanup() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [userId, record] of this.userViolations.entries()) {
      if (record.lastViolation < oneDayAgo) {
        this.userViolations.delete(userId);
      }
    }
  }
}

// Global tracker instance
const profanityTracker = new UserProfanityTracker();

module.exports = {
  checkProfanity,
  filterProfanity,
  normalizeText,
  profanityTracker,
  SEVERITY_LEVELS
};