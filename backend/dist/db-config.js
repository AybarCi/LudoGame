// Production Database Configuration for SQL Server
// Bu dosyayı db-config.js olarak kopyalayın ve ortam değişkenlerinizi ayarlayın

module.exports = {
    server: process.env.DB_SERVER || '192.168.1.21',
    database: process.env.DB_DATABASE || 'LudoGameDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrongPassword123!',
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' || true, // Azure için true
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || true, // Self-signed sertifikalar için
        enableArithAbort: true,
        requestTimeout: 30000, // 30 saniye
        connectionTimeout: 30000, // 30 saniye
        pool: {
            max: 10, // Maksimum bağlantı sayısı
            min: 0,  // Minimum bağlantı sayısı
            idleTimeoutMillis: 30000 // Boşta kalma süresi
        }
    },
    // Connection string alternatifi (gerekirse)
    connectionString: process.env.DB_CONNECTION_STRING || null
};

// Ortam değişkenleri kontrolü
if (!process.env.DB_PASSWORD) {
    console.warn('⚠️  DB_PASSWORD ortam değişkeni ayarlanmamış!');
}

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET ortam değişkeni ayarlanmamış!');
}

// Production ortamında debug bilgilerini gizle
if (process.env.NODE_ENV === 'production') {
    console.log('✅ Production veritabanı yapılandırması yüklendi');
} else {
    console.log('🔧 Development veritabanı yapılandırması yüklendi');
    console.log('📊 Veritabanı:', module.exports.database);
    console.log('🖥️  Sunucu:', module.exports.server);
    console.log('🔌 Port:', module.exports.port);
}