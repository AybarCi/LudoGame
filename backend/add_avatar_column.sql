-- Kullanıcı avatar/profil fotoğrafı alanı ekleme
-- Bu script SQL Server Management Studio'da çalıştırılmalıdır

USE ludoturcodb;
GO

-- Users tablosuna avatar_url alanı ekle
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.users') 
    AND name = 'avatar_url'
)
BEGIN
    ALTER TABLE users 
    ADD avatar_url NVARCHAR(500) NULL;
    
    PRINT 'avatar_url alanı başarıyla eklendi.';
END
ELSE
BEGIN
    PRINT 'avatar_url alanı zaten mevcut.';
END
GO

-- Varsayılan avatar URL'i güncelle (opsiyonel)
-- UPDATE users SET avatar_url = '/default-avatar.png' WHERE avatar_url IS NULL;
-- GO

PRINT 'Avatar alanı migration işlemi tamamlandı.';
GO