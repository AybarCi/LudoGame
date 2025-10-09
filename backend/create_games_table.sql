-- Games tablosu oluşturma scripti
USE ludoturcodb;
GO

-- Games tablosu oluştur (eğer yoksa)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='games' AND xtype='U')
BEGIN
    CREATE TABLE games (
        id NVARCHAR(36) PRIMARY KEY,
        room_code NVARCHAR(6) NOT NULL UNIQUE,
        status NVARCHAR(20) NOT NULL DEFAULT 'waiting',
        host_id NVARCHAR(36) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        game_state NVARCHAR(MAX) NULL,
        FOREIGN KEY (host_id) REFERENCES users(id)
    );
END
GO

-- Games tablosu için indeksler
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_games_room_code')
BEGIN
    CREATE INDEX IX_games_room_code ON games(room_code);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_games_status')
BEGIN
    CREATE INDEX IX_games_status ON games(status);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_games_host_id')
BEGIN
    CREATE INDEX IX_games_host_id ON games(host_id);
END
GO

PRINT 'Games tablosu başarıyla oluşturuldu!';