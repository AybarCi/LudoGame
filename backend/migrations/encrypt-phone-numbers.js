// Mevcut telefon numaralarını şifrelemek için migration script
const sql = require('mssql');
const { encryptPhoneNumber } = require('../utils/encryption');

// Veritabanı bağlantı ayarları
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'LudoDB',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function executeQuery(query, params = []) {
    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        
        params.forEach(param => {
            request.input(param.name, param.type, param.value);
        });
        
        const result = await request.query(query);
        await sql.close();
        return result.recordset;
    } catch (error) {
        console.error('Veritabanı hatası:', error);
        throw error;
    }
}

async function encryptExistingPhoneNumbers() {
    try {
        console.log('📱 Mevcut telefon numaraları şifreleniyor...');
        
        // Tüm kullanıları çek - hem açık hem şifreli telefon numaraları var
        const result = await executeQuery(`
            SELECT id, phone_number, encrypted_phone 
            FROM users 
            WHERE phone_number IS NOT NULL 
            AND encrypted_phone IS NULL
        `);
        
        console.log(`Şifrelenecek ${result.length} adet telefon numarası bulundu.`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const user of result) {
            try {
                if (user.phone_number) {
                    // Telefon numarasını şifrele
                    const encryptedPhone = encryptPhoneNumber(user.phone_number);
                    
                    // Şifrelenmiş telefonu güncelle
                    await executeQuery(
                        'UPDATE users SET encrypted_phone = @encryptedPhone WHERE id = @userId',
                        [
                            { name: 'encryptedPhone', type: sql.NVarChar(255), value: encryptedPhone },
                            { name: 'userId', type: sql.Int, value: user.id }
                        ]
                    );
                    
                    successCount++;
                    console.log(`✅ Kullanıcı ${user.id} için telefon numarası şifrelendi`);
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Kullanıcı ${user.id} için hata:`, error.message);
            }
        }
        
        console.log(`\n📊 Migration tamamlandı:`);
        console.log(`✅ Başarılı: ${successCount}`);
        console.log(`❌ Hatalı: ${errorCount}`);
        console.log(`📱 Toplam: ${result.length}`);
        
        // İstatistikleri göster
        const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN phone_number IS NOT NULL THEN 1 END) as has_phone_number,
                COUNT(CASE WHEN encrypted_phone IS NOT NULL THEN 1 END) as has_encrypted_phone
            FROM users
        `);
        
        console.log('\n📈 Kullanıcı istatistikleri:');
        console.log(`Toplam kullanıcı: ${stats[0].total_users}`);
        console.log(`Telefon numarası olan: ${stats[0].has_phone_number}`);
        console.log(`Şifreli telefonu olan: ${stats[0].has_encrypted_phone}`);
        
    } catch (error) {
        console.error('Migration hatası:', error);
    } finally {
        await sql.close();
    }
}

// Script'i çalıştır
if (require.main === module) {
    encryptExistingPhoneNumbers()
        .then(() => {
            console.log('Migration script tamamlandı.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Migration script hatası:', error);
            process.exit(1);
        });
}

module.exports = { encryptExistingPhoneNumbers };