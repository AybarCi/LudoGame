-- Telefon numarası şifreleme migration script'i
-- Bu script mevcut açık telefon numaralarını şifreler

-- 1. encrypted_phone sütunu ekle (varsa tekrar ekleme)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'encrypted_phone')
BEGIN
    ALTER TABLE users ADD encrypted_phone NVARCHAR(255);
    PRINT 'encrypted_phone sütunu eklendi.';
END
ELSE
BEGIN
    PRINT 'encrypted_phone sütunu zaten var.';
END
GO

-- 2. phone_number sütununu nullable yap (migration için)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'phone_number')
BEGIN
    -- Önce constraint'leri kaldır
    IF EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_users_phone_number')
    BEGIN
        ALTER TABLE users DROP CONSTRAINT UQ_users_phone_number;
        PRINT 'UQ_users_phone_number constrainti kaldırıldı.';
    END
    
    -- Index'leri kaldır
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_phone_number')
    BEGIN
        DROP INDEX IX_users_phone_number ON users;
        PRINT 'IX_users_phone_number indexi kaldırıldı.';
    END
    
    -- Sütunu nullable yap ve NVARCHAR(255) olarak güncelle
    ALTER TABLE users ALTER COLUMN phone_number NVARCHAR(255) NULL;
    PRINT 'phone_number sütunu nullable yapıldı.';
END
ELSE
BEGIN
    PRINT 'phone_number sütunu yok, migration tamamlandı.';
END
GO

-- Mevcut açık telefon numaralarını şifreleme script'i
-- Bu script'i encryption.js dosyasını kullanarak çalıştırın
-- Örnek Node.js script'i:
/*
const { encryptPhoneNumber } = require('./utils/encryption');
const sql = require('mssql');

async function encryptExistingPhoneNumbers() {
    try {
        // Tüm kullanıcıları çek
        const result = await executeQuery('SELECT id, phone_number FROM users WHERE phone_number IS NOT NULL AND encrypted_phone IS NULL');
        
        for (const user of result) {
            if (user.phone_number) {
                const encryptedPhone = encryptPhoneNumber(user.phone_number);
                await executeQuery(
                    'UPDATE users SET encrypted_phone = @encryptedPhone WHERE id = @userId',
                    [
                        { name: 'encryptedPhone', type: sql.NVarChar(255), value: encryptedPhone },
                        { name: 'userId', type: sql.Int, value: user.id }
                    ]
                );
                console.log(`Kullanıcı ${user.id} için telefon numarası şifrelendi`);
            }
        }
        
        console.log('Tüm telefon numaraları başarıyla şifrelendi');
    } catch (error) {
        console.error('Telefon numarası şifreleme hatası:', error);
    }
}
*/

-- Migration tamamlandıktan sonra phone_number sütununu kaldırabilirsiniz:
-- ALTER TABLE users DROP COLUMN phone_number;

-- Index oluştur (encrypted_phone için)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_encrypted_phone')
BEGIN
    CREATE INDEX IX_users_encrypted_phone ON users(encrypted_phone);
END
GO

PRINT 'Telefon numarası şifreleme migration script yüklendi.';