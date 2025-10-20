const sql = require('mssql');
const dbConfig = require('./db-config');

async function fixPhoneColumnWithConstraint() {
    try {
        console.log('Veritabanına bağlanıyor...');
        await sql.connect(dbConfig);
        
        console.log('📏 phone_number sütununu ve constraintlerini kontrol ediyor...');
        
        // Mevcut constraintleri kontrol et
        const constraints = await sql.query(`
            SELECT 
                CONSTRAINT_NAME,
                CONSTRAINT_TYPE
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_NAME = 'users' AND CONSTRAINT_TYPE = 'UNIQUE'
        `);
        
        console.log('Mevcut unique constraintler:');
        constraints.recordset.forEach(c => console.log(`- ${c.CONSTRAINT_NAME}: ${c.CONSTRAINT_TYPE}`));
        
        // phone_number sütununa bağlı indexleri kontrol et
        const indexes = await sql.query(`
            SELECT 
                i.name AS index_name,
                i.is_unique,
                c.name AS column_name
            FROM sys.indexes i
            INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE i.object_id = OBJECT_ID('users') AND c.name = 'phone_number'
        `);
        
        console.log('\nphone_number sütununa bağlı indexler:');
        indexes.recordset.forEach(idx => console.log(`- ${idx.index_name} (Unique: ${idx.is_unique})`));
        
        // Eğer unique constraint varsa, bunu kaldır
        for (const constraint of constraints.recordset) {
            if (constraint.CONSTRAINT_NAME.includes('phone')) {
                console.log(`\n🔓 ${constraint.CONSTRAINT_NAME} constraintini kaldırıyor...`);
                try {
                    await sql.query(`ALTER TABLE users DROP CONSTRAINT ${constraint.CONSTRAINT_NAME}`);
                    console.log(`✅ ${constraint.CONSTRAINT_NAME} constrainti kaldırıldı`);
                } catch (error) {
                    console.log(`⚠️ ${constraint.CONSTRAINT_NAME} constrainti kaldırılamadı: ${error.message}`);
                }
            }
        }
        
        // Eğer unique index varsa, bunu kaldır
        for (const index of indexes.recordset) {
            if (index.is_unique && index.index_name.includes('phone')) {
                console.log(`\n🔓 ${index.index_name} unique indexini kaldırıyor...`);
                try {
                    await sql.query(`DROP INDEX ${index.index_name} ON users`);
                    console.log(`✅ ${index.index_name} unique indexi kaldırıldı`);
                } catch (error) {
                    console.log(`⚠️ ${index.index_name} unique indexi kaldırılamadı: ${error.message}`);
                }
            }
        }
        
        // Şimdi sütun uzunluğunu güncelle
        console.log('\n📏 phone_number sütun uzunluğunu güncelliyor...');
        await sql.query(`ALTER TABLE users ALTER COLUMN phone_number NVARCHAR(255) NULL`);
        console.log('✅ phone_number sütunu NVARCHAR(255) olarak güncellendi');
        
        // Normal (non-unique) index oluştur (performans için)
        console.log('\n📊 phone_number için normal index oluşturuyor...');
        try {
            await sql.query(`CREATE INDEX IX_users_phone_number ON users(phone_number)`);
            console.log('✅ phone_number için normal index oluşturuldu');
        } catch (error) {
            console.log('⚠️ Index oluşturulamadı (zaten var olabilir):', error.message);
        }
        
        console.log('\n🎉 phone_number sütun güncellemesi tamamlandı');
        
        // Son durumu kontrol et
        const finalCheck = await sql.query(`
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number'
        `);
        
        if (finalCheck.recordset.length > 0) {
            const col = finalCheck.recordset[0];
            console.log(`\n📋 Son durum: ${col.COLUMN_NAME} - ${col.DATA_TYPE}(${col.CHARACTER_MAXIMUM_LENGTH}), Nullable: ${col.IS_NULLABLE}`);
        }
        
    } catch (error) {
        console.error('Veritabanı hatası:', error);
        console.error('Hata detayı:', error.message);
    } finally {
        await sql.close();
        console.log('\nVeritabanı bağlantısı kapatıldı.');
    }
}

// Script'i çalıştır
fixPhoneColumnWithConstraint();