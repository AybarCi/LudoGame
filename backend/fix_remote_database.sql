-- Remote Database (mssql.istekbilisim.com) Eksik Alanları Düzeltme Scripti
-- Bu script tüm eksik alanları ve yanlış yapılandırmaları düzeltir

USE LudoGameDB;
GO

-- 1. USERS TABLOSU - Eksik Alanları Ekle
PRINT 'Users tablosu eksik alanlar ekleniyor...'

-- password_hash sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash')
BEGIN
    ALTER TABLE users ADD password_hash NVARCHAR(255) NULL;
    PRINT '✅ password_hash sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ password_hash sütunu zaten mevcut';
END

-- nickname sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'nickname')
BEGIN
    ALTER TABLE users ADD nickname NVARCHAR(50) NULL;
    PRINT '✅ nickname sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ nickname sütunu zaten mevcut';
END

-- salt sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'salt')
BEGIN
    ALTER TABLE users ADD salt NVARCHAR(255) NULL;
    PRINT '✅ salt sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ salt sütunu zaten mevcut';
END

-- password sütununu password_hash olarak yeniden adlandır (eğer password_hash yoksa)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password')
    AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash')
BEGIN
    EXEC sp_rename 'users.password', 'password_hash', 'COLUMN';
    PRINT '✅ password sütunu password_hash olarak yeniden adlandırıldı';
END
GO

-- 2. GAMES TABLOSU - Eksik Alanları Ekle
PRINT 'Games tablosu eksik alanlar ekleniyor...'

-- current_player sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'games' AND COLUMN_NAME = 'current_player')
BEGIN
    ALTER TABLE games ADD current_player NVARCHAR(36) NULL;
    PRINT '✅ current_player sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ current_player sütunu zaten mevcut';
END

-- winner_id sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'games' AND COLUMN_NAME = 'winner_id')
BEGIN
    ALTER TABLE games ADD winner_id NVARCHAR(36) NULL;
    PRINT '✅ winner_id sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ winner_id sütunu zaten mevcut';
END

-- game_data sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'games' AND COLUMN_NAME = 'game_data')
BEGIN
    ALTER TABLE games ADD game_data NVARCHAR(MAX) NULL;
    PRINT '✅ game_data sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ game_data sütunu zaten mevcut';
END

-- current_turn_user_id sütununu current_player olarak yeniden adlandır (eğer current_player yoksa)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'games' AND COLUMN_NAME = 'current_turn_user_id')
    AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'games' AND COLUMN_NAME = 'current_player')
BEGIN
    EXEC sp_rename 'games.current_turn_user_id', 'current_player', 'COLUMN';
    PRINT '✅ current_turn_user_id sütunu current_player olarak yeniden adlandırıldı';
END
GO

-- 3. GAME_PLAYERS TABLOSU - Eksik Alanları Ekle
PRINT 'Game_players tablosu eksik alanlar ekleniyor...'

-- position sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_players' AND COLUMN_NAME = 'position')
BEGIN
    ALTER TABLE game_players ADD position INT NULL DEFAULT 0;
    PRINT '✅ position sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ position sütunu zaten mevcut';
END

-- updated_at sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_players' AND COLUMN_NAME = 'updated_at')
BEGIN
    ALTER TABLE game_players ADD updated_at DATETIME2 NULL DEFAULT GETDATE();
    PRINT '✅ updated_at sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ updated_at sütunu zaten mevcut';
END
GO

-- 4. USERPAWNS TABLOSU - Tamamen Yeniden Yapılandır
PRINT 'UserPawns tablosu yeniden yapılandırılıyor...'

-- Eski tabloyu yedekle
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserPawns')
BEGIN
    IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserPawns_backup')
    BEGIN
        DROP TABLE UserPawns_backup;
    END
    
    SELECT * INTO UserPawns_backup FROM UserPawns;
    PRINT '✅ UserPawns tablosu yedeklendi (UserPawns_backup)';
    
    DROP TABLE UserPawns;
    PRINT '✅ Eski UserPawns tablosu silindi';
END

-- Yeni UserPawns tablosunu oluştur
CREATE TABLE UserPawns (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id NVARCHAR(36) NOT NULL,
    pawn_type NVARCHAR(50) NOT NULL,
    color NVARCHAR(20) NOT NULL,
    position_x INT NULL DEFAULT 0,
    position_y INT NULL DEFAULT 0,
    is_active BIT NULL DEFAULT 1,
    created_at DATETIME2 NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL DEFAULT GETDATE()
);

PRINT '✅ Yeni UserPawns tablosu oluşturuldu';
GO

-- 5. GAME_SESSIONS TABLOSU - Eksik Alanları Ekle
PRINT 'Game_sessions tablosu eksik alanlar ekleniyor...'

-- game_id sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_sessions' AND COLUMN_NAME = 'game_id')
BEGIN
    ALTER TABLE game_sessions ADD game_id NVARCHAR(36) NULL;
    PRINT '✅ game_id sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ game_id sütunu zaten mevcut';
END

-- user_id sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_sessions' AND COLUMN_NAME = 'user_id')
BEGIN
    ALTER TABLE game_sessions ADD user_id NVARCHAR(36) NULL;
    PRINT '✅ user_id sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ user_id sütunu zaten mevcut';
END

-- session_data sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_sessions' AND COLUMN_NAME = 'session_data')
BEGIN
    ALTER TABLE game_sessions ADD session_data NVARCHAR(MAX) NULL;
    PRINT '✅ session_data sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ session_data sütunu zaten mevcut';
END

-- room_id sütununu game_id olarak yeniden adlandır (eğer game_id yoksa)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'game_sessions' AND COLUMN_NAME = 'room_id')
    AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'game_sessions' AND COLUMN_NAME = 'game_id')
BEGIN
    EXEC sp_rename 'game_sessions.room_id', 'game_id', 'COLUMN';
    PRINT '✅ room_id sütunu game_id olarak yeniden adlandırıldı';
END
GO

-- 6. GAME_PARTICIPANTS TABLOSU - Eksik Alanları Ekle
PRINT 'Game_participants tablosu eksik alanlar ekleniyor...'

-- game_id sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_participants' AND COLUMN_NAME = 'game_id')
BEGIN
    ALTER TABLE game_participants ADD game_id NVARCHAR(36) NULL;
    PRINT '✅ game_id sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ game_id sütunu zaten mevcut';
END

-- player_order sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_participants' AND COLUMN_NAME = 'player_order')
BEGIN
    ALTER TABLE game_participants ADD player_order INT NULL DEFAULT 0;
    PRINT '✅ player_order sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ player_order sütunu zaten mevcut';
END

-- color sütunu yoksa ekle (player_color yerine)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_participants' AND COLUMN_NAME = 'color')
BEGIN
    ALTER TABLE game_participants ADD color NVARCHAR(20) NULL;
    PRINT '✅ color sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ color sütunu zaten mevcut';
END

-- status sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_participants' AND COLUMN_NAME = 'status')
BEGIN
    ALTER TABLE game_participants ADD status NVARCHAR(20) NULL DEFAULT 'active';
    PRINT '✅ status sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ status sütunu zaten mevcut';
END

-- created_at sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_participants' AND COLUMN_NAME = 'created_at')
BEGIN
    ALTER TABLE game_participants ADD created_at DATETIME2 NULL DEFAULT GETDATE();
    PRINT '✅ created_at sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ created_at sütunu zaten mevcut';
END

-- updated_at sütunu yoksa ekle
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'game_participants' AND COLUMN_NAME = 'updated_at')
BEGIN
    ALTER TABLE game_participants ADD updated_at DATETIME2 NULL DEFAULT GETDATE();
    PRINT '✅ updated_at sütunu eklendi';
END
ELSE
BEGIN
    PRINT 'ℹ️ updated_at sütunu zaten mevcut';
END

-- player_color sütununu color olarak yeniden adlandır (eğer color yoksa)
IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'game_participants' AND COLUMN_NAME = 'player_color')
    AND NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = 'game_participants' AND COLUMN_NAME = 'color')
BEGIN
    EXEC sp_rename 'game_participants.player_color', 'color', 'COLUMN';
    PRINT '✅ player_color sütunu color olarak yeniden adlandırıldı';
END
GO

-- 7. INDEXLERI OLUŞTUR
PRINT 'Indexler oluşturuluyor...'

-- Users tablosu için indexler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_email')
BEGIN
    CREATE INDEX IX_users_email ON users(email);
    PRINT '✅ IX_users_email indexi oluşturuldu';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_phone')
BEGIN
    CREATE INDEX IX_users_phone ON users(phone_number);
    PRINT '✅ IX_users_phone indexi oluşturuldu';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_users_encrypted_phone')
BEGIN
    CREATE INDEX IX_users_encrypted_phone ON users(encrypted_phone);
    PRINT '✅ IX_users_encrypted_phone indexi oluşturuldu';
END

-- Games tablosu için indexler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_games_room_code')
BEGIN
    CREATE INDEX IX_games_room_code ON games(room_code);
    PRINT '✅ IX_games_room_code indexi oluşturuldu';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_games_host_id')
BEGIN
    CREATE INDEX IX_games_host_id ON games(host_id);
    PRINT '✅ IX_games_host_id indexi oluşturuldu';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_games_status')
BEGIN
    CREATE INDEX IX_games_status ON games(status);
    PRINT '✅ IX_games_status indexi oluşturuldu';
END

-- Game_players tablosu için indexler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_players_game_id')
BEGIN
    CREATE INDEX IX_game_players_game_id ON game_players(game_id);
    PRINT '✅ IX_game_players_game_id indexi oluşturuldu';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_players_user_id')
BEGIN
    CREATE INDEX IX_game_players_user_id ON game_players(user_id);
    PRINT '✅ IX_game_players_user_id indexi oluşturuldu';
END

-- Phone_verifications tablosu için indexler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_phone_verifications_phone')
BEGIN
    CREATE INDEX IX_phone_verifications_phone ON phone_verifications(phone_number);
    PRINT '✅ IX_phone_verifications_phone indexi oluşturuldu';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_phone_verifications_code')
BEGIN
    CREATE INDEX IX_phone_verifications_code ON phone_verifications(verification_code);
    PRINT '✅ IX_phone_verifications_code indexi oluşturuldu';
END

-- Refresh_tokens tablosu için indexler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_refresh_tokens_user_id')
BEGIN
    CREATE INDEX IX_refresh_tokens_user_id ON refresh_tokens(user_id);
    PRINT '✅ IX_refresh_tokens_user_id indexi oluşturuldu';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_refresh_tokens_token')
BEGIN
    CREATE INDEX IX_refresh_tokens_token ON refresh_tokens(token);
    PRINT '✅ IX_refresh_tokens_token indexi oluşturuldu';
END

-- UserPawns tablosu için indexler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_userpawns_user_id')
BEGIN
    CREATE INDEX IX_userpawns_user_id ON UserPawns(user_id);
    PRINT '✅ IX_userpawns_user_id indexi oluşturuldu';
END

PRINT '✅ Tüm indexler oluşturuldu';
GO

-- 8. FOREIGN KEY CONSTRAINTLERI EKLE
PRINT 'Foreign key constraintleri ekleniyor...'

-- Games tablosu için foreign key
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_games_host_id')
BEGIN
    ALTER TABLE games ADD CONSTRAINT FK_games_host_id FOREIGN KEY (host_id) REFERENCES users(id);
    PRINT '✅ FK_games_host_id constrainti eklendi';
END

-- Game_players tablosu için foreign keyler
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_game_players_game_id')
BEGIN
    ALTER TABLE game_players ADD CONSTRAINT FK_game_players_game_id FOREIGN KEY (game_id) REFERENCES games(id);
    PRINT '✅ FK_game_players_game_id constrainti eklendi';
END

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_game_players_user_id')
BEGIN
    ALTER TABLE game_players ADD CONSTRAINT FK_game_players_user_id FOREIGN KEY (user_id) REFERENCES users(id);
    PRINT '✅ FK_game_players_user_id constrainti eklendi';
END

-- Refresh_tokens tablosu için foreign key
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_refresh_tokens_user_id')
BEGIN
    ALTER TABLE refresh_tokens ADD CONSTRAINT FK_refresh_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(id);
    PRINT '✅ FK_refresh_tokens_user_id constrainti eklendi';
END

-- UserPawns tablosu için foreign key
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_userpawns_user_id')
BEGIN
    ALTER TABLE UserPawns ADD CONSTRAINT FK_userpawns_user_id FOREIGN KEY (user_id) REFERENCES users(id);
    PRINT '✅ FK_userpawns_user_id constrainti eklendi';
END

PRINT '✅ Tüm foreign key constraintleri eklendi';
GO

-- 9. SON KONTROL
PRINT '========================================='
PRINT '✅ TÜM EKSİK ALANLAR VE YAPILANDIRMALAR DÜZELTİLDİ!'
PRINT '========================================='
PRINT ''
PRINT 'Yapılan değişiklikler:'
PRINT '- Users tablosuna: password_hash, nickname, salt sütunları eklendi'
PRINT '- Games tablosuna: current_player, winner_id, game_data sütunları eklendi'
PRINT '- Game_players tablosuna: position, updated_at sütunları eklendi'
PRINT '- UserPawns tablosu tamamen yeniden yapılandırıldı'
PRINT '- Game_sessions tablosuna: game_id, user_id, session_data sütunları eklendi'
PRINT '- Game_participants tablosuna: game_id, player_order, color, status, created_at, updated_at sütunları eklendi'
PRINT '- Tüm gerekli indexler oluşturuldu'
PRINT '- Tüm foreign key constraintleri eklendi'
PRINT ''
PRINT 'Artık /api/verify-phone endpoint çalışmalı!'
GO