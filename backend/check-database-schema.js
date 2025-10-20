const sql = require('mssql');
const dbConfig = require('./db-config');

async function checkDatabaseSchema() {
    try {
        console.log('Veritabanına bağlanıyor...');
        await sql.connect(dbConfig);
        
        // Users tablosu sütunlarını kontrol et
        console.log('\n📊 Users tablosu sütunları:');
        const result = await sql.query(`
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                CHARACTER_MAXIMUM_LENGTH,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.table(result.recordset);
        
        // Indexleri kontrol et
        console.log('\n🔍 Users tablosu indexleri:');
        const indexes = await sql.query(`
            SELECT 
                i.name AS index_name,
                i.type_desc,
                c.name AS column_name
            FROM sys.indexes i
            INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE i.object_id = OBJECT_ID('users')
            ORDER BY i.name, ic.key_ordinal
        `);
        
        console.table(indexes.recordset);
        
        // Constraint'leri kontrol et
        console.log('\n🔒 Users tablosu constraintleri:');
        const constraints = await sql.query(`
            SELECT 
                CONSTRAINT_NAME,
                CONSTRAINT_TYPE
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
            WHERE TABLE_NAME = 'users'
            ORDER BY CONSTRAINT_TYPE
        `);
        
        console.table(constraints.recordset);
        
        // encrypted_phone sütunu var mı kontrol et
        const hasEncryptedPhone = result.recordset.some(col => col.COLUMN_NAME === 'encrypted_phone');
        const hasPhoneNumber = result.recordset.some(col => col.COLUMN_NAME === 'phone_number');
        
        console.log('\n📋 Özet:');
        console.log(`- encrypted_phone sütunu: ${hasEncryptedPhone ? 'VAR ✅' : 'YOK ❌'}`);
        console.log(`- phone_number sütunu: ${hasPhoneNumber ? 'VAR ✅' : 'YOK ❌'}`);
        
        if (hasEncryptedPhone && hasPhoneNumber) {
            console.log('\n💡 Migration için hazır durumda');
        }
        
    } catch (error) {
        console.error('Veritabanı hatası:', error);
    } finally {
        await sql.close();
        console.log('\nVeritabanı bağlantısı kapatıldı.');
    }
}

checkDatabaseSchema();