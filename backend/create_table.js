const sql = require('mssql');
const dbConfig = require('./db-config');

async function createTable() {
    try {
        console.log('Veritabanına bağlanıyor...');
        await sql.connect(dbConfig);
        
        console.log('phone_verifications tablosu oluşturuluyor...');
        
        const createTableQuery = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='phone_verifications' AND xtype='U')
        BEGIN
            CREATE TABLE phone_verifications (
                id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
                phone_number NVARCHAR(20) NOT NULL,
                verification_code NVARCHAR(6) NOT NULL,
                expires_at DATETIME2 NOT NULL,
                is_used BIT DEFAULT 0,
                created_at DATETIME2 DEFAULT GETDATE()
            );
            
            CREATE INDEX IX_phone_verifications_phone_number ON phone_verifications(phone_number);
            CREATE INDEX IX_phone_verifications_code ON phone_verifications(verification_code);
        END
        `;
        
        await sql.query(createTableQuery);
        console.log('phone_verifications tablosu başarıyla oluşturuldu.');
        
        console.log('users tablosuna phone_number alanı ekleniyor...');
        
        const alterTableQuery = `
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'phone_number')
        BEGIN
            ALTER TABLE users ADD phone_number NVARCHAR(20) NULL;
            CREATE INDEX IX_users_phone_number ON users(phone_number);
        END
        `;
        
        await sql.query(alterTableQuery);
        console.log('users tablosuna phone_number alanı eklendi.');
        
        console.log('Benzersiz constraint ekleniyor...');
        
        const constraintQuery = `
        -- Sadece dolu değerler için benzersiz constraint
        IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_users_phone_number')
        BEGIN
            CREATE UNIQUE INDEX UQ_users_phone_number ON users(phone_number) WHERE phone_number IS NOT NULL;
        END
        `;
        
        await sql.query(constraintQuery);
        console.log('Benzersiz constraint eklendi.');
        
    } catch (error) {
        console.error('Hata oluştu:', error);
    } finally {
        await sql.close();
        console.log('Veritabanı bağlantısı kapatıldı.');
    }
}

createTable();