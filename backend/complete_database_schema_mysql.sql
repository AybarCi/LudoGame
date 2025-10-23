-- Ludo Game Database Creation Script for MySQL/PostgreSQL
-- Bu script MySQL veya PostgreSQL'de çalıştırılabilir

-- Veritabanı oluştur (eğer yoksa)
CREATE DATABASE IF NOT EXISTS ludoturcodb;
USE ludoturcodb;

-- 1. USERS TABLOSU - Ana kullanıcı tablosu
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NULL,
    phone_number VARCHAR(255) NULL, -- SMS doğrulama için
    encrypted_phone VARCHAR(255) NULL, -- Şifrelenmiş telefon numarası
    avatar_url VARCHAR(500) NULL, -- Profil fotoğrafı URL'i
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    diamonds INT DEFAULT 10, -- Oyuncunun elmasları
    energy INT DEFAULT 100, -- Oyuncunun enerjisi
    last_energy_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INT DEFAULT 0, -- Oyuncunun skoru
    games_played INT DEFAULT 0, -- Oynadığı toplam oyun sayısı
    wins INT DEFAULT 0, -- Kazandığı toplam oyun sayısı
    losses INT DEFAULT 0 -- Kaybettiği toplam oyun sayısı
);

-- 2. PHONE VERIFICATIONS TABLOSU - SMS doğrulama kodları
CREATE TABLE IF NOT EXISTS phone_verifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
    phone_number VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. REFRESH TOKENS TABLOSU - JWT refresh token'ları
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. GAMES TABLOSU - Oyun oturumları
CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
    room_code VARCHAR(6) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
    host_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    game_state TEXT NULL, -- Oyun durumu (JSON formatında)
    winner_id VARCHAR(36) NULL, -- Kazanan oyuncu
    FOREIGN KEY (host_id) REFERENCES users(id)
);

-- 5. GAME PLAYERS TABLOSU - Oyuncu katılımları
CREATE TABLE IF NOT EXISTS game_players (
    id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
    game_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    socket_id VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    color VARCHAR(10) NOT NULL, -- red, blue, green, yellow
    player_order INT NOT NULL,
    is_bot BOOLEAN DEFAULT FALSE, -- Bot mu?
    selected_pawn VARCHAR(50) DEFAULT 'default', -- Seçilen piyon tipi
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    is_winner BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY UQ_game_players_game_user (game_id, user_id)
);

-- 6. USER PAWNS TABLOSU - Kullanıcı piyon satın alımları
CREATE TABLE IF NOT EXISTS UserPawns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    pawn_id VARCHAR(50) NOT NULL, -- Piyon tipi (örn: 'gold', 'silver', 'bronze')
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE, -- Aktif mi?
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY UQ_UserPawns_user_pawn (user_id, pawn_id)
);

-- 7. GAME SESSIONS TABLOSU (BACKWARD COMPATIBILITY) - Eski oyun oturumları
CREATE TABLE IF NOT EXISTS game_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT UUID(),
    room_id VARCHAR(50) NOT NULL,
    player_count INT DEFAULT 0,
    game_state TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 8. GAME PARTICIPANTS TABLOSU (BACKWARD COMPATIBILITY) - Eski katılımcılar
CREATE TABLE IF NOT EXISTS game_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    player_color VARCHAR(10),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    is_winner BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- İNDEKS OLUŞTURMA
-- Kullanıcılar için indeksler
CREATE INDEX IF NOT EXISTS IX_users_username ON users(username);
CREATE INDEX IF NOT EXISTS IX_users_email ON users(email);
CREATE INDEX IF NOT EXISTS IX_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS IX_users_encrypted_phone ON users(encrypted_phone);

-- Telefon doğrulama için indeksler
CREATE INDEX IF NOT EXISTS IX_phone_verifications_phone_number ON phone_verifications(phone_number);
CREATE INDEX IF NOT EXISTS IX_phone_verifications_code ON phone_verifications(verification_code);
CREATE INDEX IF NOT EXISTS IX_phone_verifications_composite ON phone_verifications(phone_number, verification_code, is_used, expires_at);

-- Refresh token indeksleri
CREATE INDEX IF NOT EXISTS IX_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS IX_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS IX_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Games tablosu indeksleri
CREATE INDEX IF NOT EXISTS IX_games_room_code ON games(room_code);
CREATE INDEX IF NOT EXISTS IX_games_status ON games(status);
CREATE INDEX IF NOT EXISTS IX_games_host_id ON games(host_id);
CREATE INDEX IF NOT EXISTS IX_games_winner_id ON games(winner_id);

-- Game players indeksleri
CREATE INDEX IF NOT EXISTS IX_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS IX_game_players_user_id ON game_players(user_id);
CREATE INDEX IF NOT EXISTS IX_game_players_socket_id ON game_players(socket_id);

-- UserPawns indeksleri
CREATE INDEX IF NOT EXISTS IX_UserPawns_user_id ON UserPawns(user_id);

-- Eski tablolar için indeksler (backward compatibility)
CREATE INDEX IF NOT EXISTS IX_game_sessions_room_id ON game_sessions(room_id);
CREATE INDEX IF NOT EXISTS IX_game_participants_session_id ON game_participants(session_id);
CREATE INDEX IF NOT EXISTS IX_game_participants_user_id ON game_participants(user_id);

-- DEFAULT KULLANICI EKLEME (Opsiyonel - Test için)
INSERT IGNORE INTO users (id, username, email, password_hash, salt, nickname, diamonds, energy, score, games_played, wins, losses)
VALUES (
    UUID(),
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

SELECT '✅ Ludo Game Database kurulumu tamamlandı!' AS message;
SELECT '📊 Veritabanı adı: ludoturcodb' AS message;
SELECT '🗂️  Oluşturulan tablolar:' AS message;
SELECT '   - users (Ana kullanıcı tablosu)' AS message;
SELECT '   - phone_verifications (SMS doğrulama)' AS message;
SELECT '   - refresh_tokens (JWT tokenları)' AS message;
SELECT '   - games (Oyun oturumları)' AS message;
SELECT '   - game_players (Oyuncu katılımları)' AS message;
SELECT '   - UserPawns (Kullanıcı piyonları)' AS message;
SELECT '   - game_sessions (Eski tablo - backward compatibility)' AS message;
SELECT '   - game_participants (Eski tablo - backward compatibility)' AS message;