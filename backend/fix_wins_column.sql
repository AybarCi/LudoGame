-- Fix wins column issue - Add missing columns to users table
-- Bu script mevcut users tablosuna eksik sütunları ekler

-- SQL Server versiyonu
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'wins')
BEGIN
    ALTER TABLE users ADD wins INT DEFAULT 0;
    PRINT '✅ wins sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️  wins sütunu zaten mevcut';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'losses')
BEGIN
    ALTER TABLE users ADD losses INT DEFAULT 0;
    PRINT '✅ losses sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️️  losses sütunu zaten mevcut';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'score')
BEGIN
    ALTER TABLE users ADD score INT DEFAULT 0;
    PRINT '✅ score sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️  score sütunu zaten mevcut';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'games_played')
BEGIN
    ALTER TABLE users ADD games_played INT DEFAULT 0;
    PRINT '✅ games_played sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️  games_played sütunu zaten mevcut';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'encrypted_phone')
BEGIN
    ALTER TABLE users ADD encrypted_phone NVARCHAR(255) NULL;
    PRINT '✅ encrypted_phone sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️  encrypted_phone sütunu zaten mevcut';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'avatar_url')
BEGIN
    ALTER TABLE users ADD avatar_url NVARCHAR(500) NULL;
    PRINT '✅ avatar_url sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️  avatar_url sütunu zaten mevcut';
END