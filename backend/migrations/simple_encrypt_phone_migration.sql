-- Basitleştirilmiş Telefon Numarası Migration Script'i
-- Bu script'i doğrudan SQL Server Management Studio (SSMS) veya benzeri bir araçta çalıştırın

-- 1. encrypted_phone sütununu ekle
ALTER TABLE users ADD encrypted_phone NVARCHAR(255);
GO

-- 2. phone_number sütununu NVARCHAR(255) olarak güncelle ve nullable yap
ALTER TABLE users ALTER COLUMN phone_number NVARCHAR(255) NULL;
GO

-- 3. encrypted_phone için index oluştur
CREATE INDEX IX_users_encrypted_phone ON users(encrypted_phone);
GO

-- 4. İsteğe bağlı: phone_number sütununu tamamen kaldırmak isterseniz
-- ALTER TABLE users DROP COLUMN phone_number;
-- GO