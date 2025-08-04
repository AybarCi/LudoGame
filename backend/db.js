const sql = require('mssql');
const dbConfig = require('./db-config');

// Bağlantı havuzu oluşturuluyor
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('SQL Server veritabanına başarıyla bağlanıldı.');
        return pool;
    })
    .catch(err => console.error('Veritabanı bağlantı hatası: ', err));

module.exports = {
    // Sorguları çalıştırmak için bir yardımcı fonksiyon
    executeQuery: async (query, params = []) => {
        const pool = await poolPromise;
        const request = pool.request();

        // Parametreleri isteğe ekle
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });

        const result = await request.query(query);
        return result.recordset;
    },
    sql // sql nesnesini dışa aktararak veri tiplerine (sql.NVarChar vb.) erişim sağlıyoruz
};
