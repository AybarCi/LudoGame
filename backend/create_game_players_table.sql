-- Game_players tablosu oluşturma scripti
USE ludoturcodb;
GO

-- Game_players tablosu oluştur (eğer yoksa)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='game_players' AND xtype='U')
BEGIN
    CREATE TABLE game_players (
        id NVARCHAR(36) PRIMARY KEY,
        game_id NVARCHAR(36) NOT NULL,
        user_id NVARCHAR(36) NOT NULL,
        socket_id NVARCHAR(255) NOT NULL,
        nickname NVARCHAR(50) NOT NULL,
        color NVARCHAR(10) NOT NULL,
        player_order INT NOT NULL,
        is_bot BIT DEFAULT 0,
        selected_pawn NVARCHAR(50) DEFAULT 'default',
        joined_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Game_players tablosu için indeksler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_players_game_id')
BEGIN
    CREATE INDEX IX_game_players_game_id ON game_players(game_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_players_user_id')
BEGIN
    CREATE INDEX IX_game_players_user_id ON game_players(user_id);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_game_players_socket_id')
BEGIN
    CREATE INDEX IX_game_players_socket_id ON game_players(socket_id);
END
GO

-- Aynı oyuncunun aynı odaya birden fazla katılamaması için unique constraint
IF NOT EXISTS (SELECT * FROM sys.key_constraints WHERE name = 'UQ_game_players_game_user')
BEGIN
    ALTER TABLE game_players ADD CONSTRAINT UQ_game_players_game_user UNIQUE (game_id, user_id);
END
GO

PRINT 'Game_players tablosu başarıyla oluşturuldu!';