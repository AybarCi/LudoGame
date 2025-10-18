-- Telefon doğrulama tabloları
-- SMS servisi olmadan sadece DB'ye kayıt için

-- Telefon doğrulama kodları tablosu
CREATE TABLE phone_verifications (
    id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
    phone_number NVARCHAR(255) NOT NULL,
    verification_code NVARCHAR(6) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    is_used BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    INDEX IX_phone_verifications_phone_number (phone_number),
    INDEX IX_phone_verifications_code (verification_code),
    INDEX IX_phone_verifications_composite (phone_number, verification_code, is_used, expires_at)
);

-- Kullanıcılar tablosuna telefon numarası alanı ekle
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'phone_number')
BEGIN
    ALTER TABLE users ADD phone_number NVARCHAR(255) NULL;
    CREATE INDEX IX_users_phone_number ON users(phone_number);
END

-- Benzersiz telefon numarası constraint'i
IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_users_phone_number')
BEGIN
    ALTER TABLE users ADD CONSTRAINT UQ_users_phone_number UNIQUE (phone_number);
END

GO