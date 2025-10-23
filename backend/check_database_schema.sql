-- Database Schema Check Script
-- Mevcut veritabanı yapısını kontrol etmek için

USE ludoturcodb;
GO

-- Tüm tabloları listele
PRINT '=== MEVCUT TABLOLAR ===';
SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

-- Users tablosu detayları
PRINT '';
PRINT '=== USERS TABLOSU DETAYLARI ===';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
ORDER BY ORDINAL_POSITION;
GO

-- Users tablosu indeksleri
PRINT '';
PRINT '=== USERS TABLOSU İNDEKSLERİ ===';
SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    c.name AS ColumnName,
    ic.is_included_column
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('users')
ORDER BY i.name, ic.key_ordinal;
GO

-- Foreign Key constraint'leri
PRINT '';
PRINT '=== FOREIGN KEY CONSTRAINT'LERİ ===';
SELECT 
    fk.name AS ForeignKeyName,
    tp.name AS ParentTable,
    cp.name AS ParentColumn,
    tr.name AS ReferencedTable,
    cr.name AS ReferencedColumn
FROM sys.foreign_keys fk
JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
ORDER BY tp.name, fk.name;
GO

-- Telefon doğrulama tablosu kontrolü
PRINT '';
PRINT '=== PHONE_VERIFICATIONS TABLOSU ===';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'phone_verifications' 
ORDER BY ORDINAL_POSITION;
GO

-- Games tablosu kontrolü
PRINT '';
PRINT '=== GAMES TABLOSU ===';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'games' 
ORDER BY ORDINAL_POSITION;
GO

-- Game_players tablosu kontrolü
PRINT '';
PRINT '=== GAME_PLAYERS TABLOSU ===';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'game_players' 
ORDER BY ORDINAL_POSITION;
GO

-- Kullanıcı sayısı ve istatistikler
PRINT '';
PRINT '=== KULLANICI İSTATİSTİKLERİ ===';
SELECT 
    'Toplam Kullanıcı' = COUNT(*),
    'Aktif Kullanıcılar' = SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END),
    'Telefonu Doğrulanmış' = SUM(CASE WHEN phone_number IS NOT NULL OR encrypted_phone IS NOT NULL THEN 1 ELSE 0 END),
    'Avatar\'ı Olan' = SUM(CASE WHEN avatar_url IS NOT NULL THEN 1 ELSE 0 END)
FROM users;
GO

-- Ortalama kullanıcı istatistikleri
PRINT '';
PRINT '=== ORTALAMA KULLANICI İSTATİSTİKLERİ ===';
SELECT 
    'Ortalama Elmas' = AVG(CAST(diamonds AS FLOAT)),
    'Ortalama Enerji' = AVG(CAST(energy AS FLOAT)),
    'Ortalama Skor' = AVG(CAST(score AS FLOAT)),
    'Ortalama Oyun' = AVG(CAST(games_played AS FLOAT)),
    'Ortalama Galibiyet' = AVG(CAST(wins AS FLOAT))
FROM users;
GO

-- En son oluşturulan kullanıcılar
PRINT '';
PRINT '=== SON 5 KULLANICI ===';
SELECT TOP 5
    username,
    nickname,
    email,
    phone_number,
    created_at,
    diamonds,
    energy
FROM users
ORDER BY created_at DESC;
GO

-- Telefon doğrulama kodları durumu
PRINT '';
PRINT '=== TELEFON DOĞRULAMA DURUMU ===';
SELECT 
    'Toplam Kod' = COUNT(*),
    'Kullanılmış Kodlar' = SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END),
    'Kullanılmamış Kodlar' = SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END),
    'Süresi Dolmuş Kodlar' = SUM(CASE WHEN expires_at < GETDATE() THEN 1 ELSE 0 END)
FROM phone_verifications;
GO

-- Database boyutu bilgisi
PRINT '';
PRINT '=== VERİTABANI BOYUTU ===';
SELECT 
    DB_NAME(database_id) AS DatabaseName,
    CAST(SUM(size) * 8.0 / 1024 AS DECIMAL(10,2)) AS SizeMB
FROM sys.master_files 
WHERE database_id = DB_ID('ludoturcodb')
GROUP BY database_id;
GO

PRINT '';
PRINT '✅ Veritabanı kontrolü tamamlandı!';