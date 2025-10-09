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
        let pool;
        let request;
        
        try {
            console.log(`[${new Date().toISOString()}] 🗄️  DB QUERY STARTED: ${query.substring(0, 100)}...`);
            console.log(`[${new Date().toISOString()}] 📋 Parameters:`, JSON.stringify(params, null, 2));
            
            pool = await poolPromise;
            request = pool.request();
            
            // Timeout ayarını ekle
            request.timeout = 30000; // 30 saniye timeout

            // Parametreleri isteğe ekle
            params.forEach(param => {
                request.input(param.name, param.type, param.value);
            });

            const result = await request.query(query);
            
            console.log(`[${new Date().toISOString()}] ✅ DB QUERY COMPLETED - Rows: ${result.recordset ? result.recordset.length : 0}`);
            
            // For UPDATE/INSERT/DELETE queries, return the full result object
            // For SELECT queries, return just the recordset
            if (query.trim().toUpperCase().startsWith('SELECT')) {
                return result.recordset;
            } else {
                return result;
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] ❌ DB QUERY ERROR:`, error);
            console.error(`[${new Date().toISOString()}] 🔍 Query: ${query}`);
            console.error(`[${new Date().toISOString()}] 📋 Parameters:`, JSON.stringify(params, null, 2));
            
            // Timeout hatası mı kontrol et
            if (error.code === 'ETIMEOUT' || error.message.includes('timeout')) {
                throw new Error(`Database query timeout after 30 seconds. Query: ${query.substring(0, 100)}...`);
            }
            
            // UNIQUE KEY constraint hatası mı kontrol et
            if (error.message && error.message.includes('UNIQUE KEY constraint')) {
                console.error(`[${new Date().toISOString()}] 🔑 UNIQUE KEY CONSTRAINT VIOLATION DETECTED!`);
                console.error(`[${new Date().toISOString()}] 🔑 Constraint Details:`, {
                    message: error.message,
                    query: query.substring(0, 200),
                    parameters: params
                });
                
                // Daha açıklayıcı hata mesajı oluştur
                let userFriendlyMessage = 'Benzersiz kısıtlama ihlali: ';
                
                if (error.message.includes('room_code')) {
                    userFriendlyMessage += 'Bu oda kodu zaten kullanılıyor.';
                } else if (error.message.includes('game_id') && error.message.includes('user_id')) {
                    userFriendlyMessage += 'Bu oyuncu zaten bu oyunda yer alıyor.';
                } else if (error.message.includes('UQ_game_players_game_user')) {
                    userFriendlyMessage += 'Aynı oyuncu bir odaya sadece bir kez katılabilir.';
                } else {
                    userFriendlyMessage += 'Bu veri zaten sistemde mevcut.';
                }
                
                const enhancedError = new Error(userFriendlyMessage);
                enhancedError.originalError = error;
                enhancedError.constraintType = 'UNIQUE_KEY';
                enhancedError.queryContext = { query: query.substring(0, 100), params: params };
                
                throw enhancedError;
            }
            
            throw error;
        }
    },
    sql // sql nesnesini dışa aktararak veri tiplerine (sql.NVarChar vb.) erişim sağlıyoruz
};
