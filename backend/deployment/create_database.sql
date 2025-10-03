-- Ludo Game Database Creation Script for SQL Server
-- Bu script SQL Server Management Studio'da çalıştırılmalıdır

-- Veritabanı oluştur (eğer yoksa)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ludoturcodb')
BEGIN
    CREATE DATABASE ludoturcodb;
END
GO

-- Veritabanını kullan
USE ludoturcodb;
GO

-- Users tablosu oluştur
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        username NVARCHAR(50) NOT NULL UNIQUE,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        salt NVARCHAR(255) NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        diamonds INT DEFAULT 10,
        energy INT DEFAULT 100,
        last_energy_update DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- UserPawns tablosu oluştur
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserPawns' AND xtype='U')
BEGIN
    CREATE TABLE UserPawns (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id NVARCHAR(36) NOT NULL,
        pawn_id INT NOT NULL,
        purchased_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Refresh tokens tablosu oluştur
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='refresh_tokens' AND xtype='U')
BEGIN
    CREATE TABLE refresh_tokens (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        user_id NVARCHAR(36) NOT NULL,
        token NVARCHAR(500) NOT NULL UNIQUE,
        expires_at DATETIME2 NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        is_revoked BIT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Game sessions tablosu (opsiyonel - gelecekte kullanım için)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='game_sessions' AND xtype='U')
BEGIN
    CREATE TABLE game_sessions (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        room_id NVARCHAR(50) NOT NULL,
        player_count INT DEFAULT 0,
        game_state NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        is_active BIT DEFAULT 1
    );
END
GO

-- Game participants tablosu (opsiyonel - gelecekte kullanım için)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='game_participants' AND xtype='U')
BEGIN
    CREATE TABLE game_participants (
        id INT IDENTITY(1,1) PRIMARY KEY,
        session_id NVARCHAR(36) NOT NULL,
        user_id NVARCHAR(36) NOT NULL,
        player_color NVARCHAR(10),
        joined_at DATETIME2 DEFAULT GETDATE(),
        left_at DATETIME2 NULL,
        is_winner BIT DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- İndeksler oluştur
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_username')
BEGIN
    CREATE INDEX IX_users_username ON users(username);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_email')
BEGIN
    CREATE INDEX IX_users_email ON users(email);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_refresh_tokens_user_id')
BEGIN
    CREATE INDEX IX_refresh_tokens_user_id ON refresh_tokens(user_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_refresh_tokens_token')
BEGIN
    CREATE INDEX IX_refresh_tokens_token ON refresh_tokens(token);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserPawns_user_id')
BEGIN
    CREATE INDEX IX_UserPawns_user_id ON UserPawns(user_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_sessions_room_id')
BEGIN
    CREATE INDEX IX_game_sessions_room_id ON game_sessions(room_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_participants_session_id')
BEGIN
    CREATE INDEX IX_game_participants_session_id ON game_participants(session_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_participants_user_id')
BEGIN
    CREATE INDEX IX_game_participants_user_id ON game_participants(user_id);
END
GO

-- Test kullanıcısı ekle (opsiyonel)
IF NOT EXISTS (SELECT * FROM users WHERE username = 'testuser')
BEGIN
    INSERT INTO users (id, username, email, password_hash, salt, diamonds, energy)
    VALUES (
        NEWID(),
        'testuser',
        'test@ludo.com',
        'test_hash',
        'test_salt',
        50,
        100
    );
END
GO

PRINT 'Ludo Game Database kurulumu tamamlandı!';
PRINT 'Veritabanı adı: ludoturcodb';
PRINT 'Oluşturulan tablolar:';
PRINT '- users';
PRINT '- UserPawns';
PRINT '- refresh_tokens';
PRINT '- game_sessions';
PRINT '- game_participants';
GO