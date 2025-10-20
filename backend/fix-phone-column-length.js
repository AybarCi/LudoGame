const sql = require('mssql');
const dbConfig = require('./db-config');

async function fixPhoneColumnLength() {
    try {
        console.log('Veritabanına bağlanıyor...');
        await sql.connect(dbConfig);
        
        console.log('📏 phone_number sütun uzunluğunu kontrol ediyor ve güncelliyor...');
        
        // Önce mevcut sütun bilgilerini al
        const columnInfo = await sql.query(`
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number'
        `);
        
        if (columnInfo.recordset.length > 0) {
            const current = columnInfo.recordset[0];
            console.log(`Mevcut phone_number sütunu: ${current.DATA_TYPE}(${current.CHARACTER_MAXIMUM_LENGTH}), Nullable: ${current.IS_NULLABLE}`);
            
            // Eğer uzunluk yeterli değilse güncelle
            if (current.CHARACTER_MAXIMUM_LENGTH < 255) {
                console.log('📏 Sütun uzunluğu güncelleniyor...');
                await sql.query(`ALTER TABLE users ALTER COLUMN phone_number NVARCHAR(255) NULL`);
                console.log('✅ phone_number sütunu NVARCHAR(255) olarak güncellendi');
            } else {
                console.log('✅ Sütun uzunluğu zaten yeterli');
            }
            
            // Eğer nullable değilse nullable yap
            if (current.IS_NULLABLE === 'NO') {
                console.log('📏 Sütun nullable yapılıyor...');
                await sql.query(`ALTER TABLE users ALTER COLUMN phone_number NVARCHAR(255) NULL`);
                console.log('✅ phone_number sütunu nullable yapıldı');
            }
        } else {
            console.log('❌ phone_number sütunu bulunamadı');
        }
        
        console.log('🎉 phone_number sütun güncellemesi tamamlandı');
        
    } catch (error) {
        console.error('Veritabanı hatası:', error);
        console.error('Hata detayı:', error.message);
    } finally {
        await sql.close();
        console.log('Veritabanı bağlantısı kapatıldı.');
    }
}

// Script'i çalıştır
fixPhoneColumnLength();