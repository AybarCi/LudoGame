-- Refresh tokens tablosu oluştur (SQL Server)
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

-- İndeksler oluştur
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

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_refresh_tokens_expires_at')
BEGIN
    CREATE INDEX IX_refresh_tokens_expires_at ON refresh_tokens(expires_at);
END
GO