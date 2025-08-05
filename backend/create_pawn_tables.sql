-- Kullanıcı piyonları için tablo oluştur
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserPawns' AND xtype='U')
BEGIN
    CREATE TABLE UserPawns (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id NVARCHAR(36) NOT NULL,
        pawn_id NVARCHAR(50) NOT NULL,
        purchased_at DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(user_id, pawn_id)
    );
END