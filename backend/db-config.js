module.exports = {
    server: 'localhost',
    user: 'sa',
    // Lütfen Azure SQL Edge'i kurarken belirlediğiniz şifreyi buraya girin.
    password: 'Ca090353--',
    database: 'ludoturcodb', // Veritabanı adını bu şekilde bırakabiliriz.
    options: {
        encrypt: false, // Yerel geliştirme için false
        trustServerCertificate: true // Yerel geliştirme için true
    }
};
