const { executeQuery, sql } = require('./db');

async function checkUserExists() {
    const userId = '5a8ed8dc-0a98-4ec5-acc0-a5c49184f007';
    
    try {
        console.log(`Kullanıcı kontrol ediliyor: ${userId}`);
        
        // Kullanıcı var mı?
        const userResult = await executeQuery(
            'SELECT id, username, nickname, email FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );
        
        console.log(`Bulunan kullanıcı sayısı: ${userResult.length}`);
        
        if (userResult.length > 0) {
            console.log('Kullanıcı bulundu:', userResult[0]);
        } else {
            console.log('Kullanıcı bulunamadı!');
            
            // Tüm kullanıcıları göster
            const allUsers = await executeQuery('SELECT TOP 5 id, username, nickname FROM users ORDER BY created_at DESC');
            console.log('Son 5 kullanıcı:', allUsers);
        }
        
        // Tablo yapısını kontrol et
        const tableSchema = await executeQuery(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('Users tablosu sütunları:');
        tableSchema.forEach(col => {
            console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
    } catch (error) {
        console.error('Hata:', error);
    } finally {
        process.exit(0);
    }
}

checkUserExists();