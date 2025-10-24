// Production Database Configuration for SQL Server
// Bu dosyayı db-config.js olarak kopyalayın ve ortam değişkenlerinizi ayarlayın

module.exports = {
    server: process.env.DB_SERVER || 'mssql.istekbilisim.com',
    database: process.env.DB_DATABASE || 'ludoturcodb',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'SeKo153759++',
    port: parseInt(process.env.DB_PORT) || 1433,
    requestTimeout: 30000,
    connectionTimeout: 30000,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' || false,
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true' || true,
        enableArithAbort: true
    },
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