-- Ludo Game Database Creation Script for SQL Server (without GO statements)
-- Bu script SQL Server'da çalıştırılabilir, GO yerine batch ayracı olarak kullanılır

-- Veritabanı oluştur (eğer yoksa)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ludoturcodb')
BEGIN
    CREATE DATABASE ludoturcodb;
END

-- Veritabanını kullan
USE ludoturcodb;

-- 1. USERS TABLOSU - Ana kullanıcı tablosu
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        username NVARCHAR(50) NOT NULL UNIQUE,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        salt NVARCHAR(255) NOT NULL,
        nickname NVARCHAR(50) NULL,
        phone_number NVARCHAR(255) NULL, -- SMS doğrulama için
        encrypted_phone NVARCHAR(255) NULL, -- Şifrelenmiş telefon numarası
        avatar_url NVARCHAR(500) NULL, -- Profil fotoğrafı URL'i
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        diamonds INT DEFAULT 10, -- Oyuncunun elmasları
        energy INT DEFAULT 100, -- Oyuncunun enerjisi
        last_energy_update DATETIME2 DEFAULT GETDATE(),
        score INT DEFAULT 0, -- Oyuncunun skoru
        games_played INT DEFAULT 0, -- Oynadığı toplam oyun sayısı
        wins INT DEFAULT 0, -- Kazandığı toplam oyun sayısı
        losses INT DEFAULT 0 -- Kaybettiği toplam oyun sayısı
    );
END

-- 2. PHONE VERIFICATIONS TABLOSU - SMS doğrulama kodları
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='phone_verifications' AND xtype='U')
BEGIN
    CREATE TABLE phone_verifications (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        phone_number NVARCHAR(255) NOT NULL,
        verification_code NVARCHAR(6) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        is_used BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE()
    );
END

-- 3. REFRESH TOKENS TABLOSU - JWT refresh token'ları
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

-- 4. GAMES TABLOSU - Oyun oturumları
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='games' AND xtype='U')
BEGIN
    CREATE TABLE games (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        room_code NVARCHAR(6) NOT NULL UNIQUE,
        status NVARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
        host_id NVARCHAR(36) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        game_state NVARCHAR(MAX) NULL, -- Oyun durumu (JSON formatında)
        winner_id NVARCHAR(36) NULL, -- Kazanan oyuncu
        FOREIGN KEY (host_id) REFERENCES users(id)
    );
END

-- 5. GAME PLAYERS TABLOSU - Oyuncu katılımları
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='game_players' AND xtype='U')
BEGIN
    CREATE TABLE game_players (
        id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        game_id NVARCHAR(36) NOT NULL,
        user_id NVARCHAR(36) NOT NULL,
        socket_id NVARCHAR(255) NOT NULL,
        nickname NVARCHAR(50) NOT NULL,
        color NVARCHAR(10) NOT NULL, -- red, blue, green, yellow
        player_order INT NOT NULL,
        is_bot BIT DEFAULT 0, -- Bot mu?
        selected_pawn NVARCHAR(50) DEFAULT 'default', -- Seçilen piyon tipi
        joined_at DATETIME2 DEFAULT GETDATE(),
        left_at DATETIME2 NULL,
        is_winner BIT DEFAULT 0,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_game_players_game_user UNIQUE (game_id, user_id)
    );
END

-- 6. USER PAWNS TABLOSU - Kullanıcı piyon satın alımları
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserPawns' AND xtype='U')
BEGIN
    CREATE TABLE UserPawns (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id NVARCHAR(36) NOT NULL,
        pawn_id NVARCHAR(50) NOT NULL, -- Piyon tipi (örn: 'gold', 'silver', 'bronze')
        purchased_at DATETIME2 DEFAULT GETDATE(),
        is_active BIT DEFAULT 1, -- Aktif mi?
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_UserPawns_user_pawn UNIQUE (user_id, pawn_id)
    );
END

-- 7. GAME SESSIONS TABLOSU (BACKWARD COMPATIBILITY) - Eski oyun oturumları
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

-- 8. GAME PARTICIPANTS TABLOSU (BACKWARD COMPATIBILITY) - Eski katılımcılar
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

-- İNDEKS OLUŞTURMA
-- Kullanıcılar için indeksler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_username')
BEGIN
    CREATE INDEX IX_users_username ON users(username);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_email')
BEGIN
    CREATE INDEX IX_users_email ON users(email);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_phone_number')
BEGIN
    CREATE INDEX IX_users_phone_number ON users(phone_number);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_encrypted_phone')
BEGIN
    CREATE INDEX IX_users_encrypted_phone ON users(encrypted_phone);
END

-- Telefon doğrulama için indeksler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_phone_verifications_phone_number')
BEGIN
    CREATE INDEX IX_phone_verifications_phone_number ON phone_verifications(phone_number);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_phone_verifications_code')
BEGIN
    CREATE INDEX IX_phone_verifications_code ON phone_verifications(verification_code);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_phone_verifications_composite')
BEGIN
    CREATE INDEX IX_phone_verifications_composite ON phone_verifications(phone_number, verification_code, is_used, expires_at);
END

-- Refresh token indeksleri
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_refresh_tokens_user_id')
BEGIN
    CREATE INDEX IX_refresh_tokens_user_id ON refresh_tokens(user_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_refresh_tokens_token')
BEGIN
    CREATE INDEX IX_refresh_tokens_token ON refresh_tokens(token);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_refresh_tokens_expires_at')
BEGIN
    CREATE INDEX IX_refresh_tokens_expires_at ON refresh_tokens(expires_at);
END

-- Games tablosu indeksleri
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_games_room_code')
BEGIN
    CREATE INDEX IX_games_room_code ON games(room_code);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_games_status')
BEGIN
    CREATE INDEX IX_games_status ON games(status);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_games_host_id')
BEGIN
    CREATE INDEX IX_games_host_id ON games(host_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_games_winner_id')
BEGIN
    CREATE INDEX IX_games_winner_id ON games(winner_id);
END

-- Game players indeksleri
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_players_game_id')
BEGIN
    CREATE INDEX IX_game_players_game_id ON game_players(game_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_players_user_id')
BEGIN
    CREATE INDEX IX_game_players_user_id ON game_players(user_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_players_socket_id')
BEGIN
    CREATE INDEX IX_game_players_socket_id ON game_players(socket_id);
END

-- UserPawns indeksleri
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_UserPawns_user_id')
BEGIN
    CREATE INDEX IX_UserPawns_user_id ON UserPawns(user_id);
END

-- Eski tablolar için indeksler (backward compatibility)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_sessions_room_id')
BEGIN
    CREATE INDEX IX_game_sessions_room_id ON game_sessions(room_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_participants_session_id')
BEGIN
    CREATE INDEX IX_game_participants_session_id ON game_participants(session_id);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_participants_user_id')
BEGIN
    CREATE INDEX IX_game_participants_user_id ON game_participants(user_id);
END

-- DEFAULT KULLANICI EKLEME (Opsiyonel - Test için)
IF NOT EXISTS (SELECT * FROM users WHERE username = 'testuser')
BEGIN
    INSERT INTO users (id, username, email, password_hash, salt, nickname, diamonds, energy, score, games_played, wins, losses)
    VALUES (
        NEWID(),
        'testuser',
        'test@ludo.com',
        'test_hash',
        'test_salt',
        'Test Oyuncu',
        50,
        100,
        0,
        0,
        0,
        0
    );
END

-- KURULUM TAMAMLANDI MESAJI
PRINT '✅ Ludo Game Database kurulumu tamamlandı!';
PRINT '📊 Veritabanı adı: ludoturcodb';
PRINT '🗂️  Oluşturulan tablolar:';
PRINT '   - users (Ana kullanıcı tablosu)';
PRINT '   - phone_verifications (SMS doğrulama)';
PRINT '   - refresh_tokens (JWT token'ları)';
PRINT '   - games (Oyun oturumları)';
PRINT '   - game_players (Oyuncu katılımları)';
PRINT '   - UserPawns (Kullanıcı piyonları)';
PRINT '   - game_sessions (Eski tablo - backward compatibility)';
PRINT '   - game_participants (Eski tablo - backward compatibility)';
PRINT '';
PRINT '🔑 Önemli notlar:';
PRINT '   - Tüm tablolar IF NOT EXISTS ile oluşturuldu';
PRINT '   - Foreign key constraint'leri eklendi';
PRINT '   - İndeksler optimize edildi';
PRINT '   - Telefon numarası şifreleme için encrypted_phone alanı eklendi';
PRINT '   - Avatar desteği için avatar_url alanı eklendi';
PRINT '   - Oyun istatistikleri için wins, losses, score alanları eklendi';