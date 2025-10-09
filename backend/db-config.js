module.exports = {
    server: '192.168.1.21',
    user: 'sa',
    // Lütfen Azure SQL Edge'i kurarken belirlediğiniz şifreyi buraya girin.
    password: 'Ca090353--',
    database: 'ludoturcodb', // Veritabanı adını bu şekilde bırakabiliriz.
    options: {
        encrypt: false, // Yerel geliştirme için false
        trustServerCertificate: true, // Yerel geliştirme için true
        connectionTimeout: 30000, // 30 saniye bağlantı timeout
        requestTimeout: 30000, // 30 saniye sorgu timeout
        pool: {
            max: 10, // Maksimum bağlantı sayısı
            min: 0, // Minimum bağlantı sayısı
            idleTimeoutMillis: 30000 // 30 saniye idle timeout
        }
    }
};
