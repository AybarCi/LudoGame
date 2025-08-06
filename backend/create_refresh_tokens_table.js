const { executeQuery, sql } = require('./db');

async function createRefreshTokensTable() {
    try {
        console.log('Creating refresh_tokens table...');
        
        // Tablo var mı kontrol et
        const tableExists = await executeQuery(
            "SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'refresh_tokens'",
            []
        );
        
        if (tableExists.length > 0) {
            console.log('refresh_tokens table already exists.');
            return;
        }
        
        // Tabloyu oluştur
        await executeQuery(`
            CREATE TABLE refresh_tokens (
                id NVARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
                user_id NVARCHAR(36) NOT NULL,
                token NVARCHAR(500) NOT NULL UNIQUE,
                expires_at DATETIME2 NOT NULL,
                created_at DATETIME2 DEFAULT GETDATE(),
                is_revoked BIT DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `, []);
        
        console.log('refresh_tokens table created successfully.');
        
        // İndeksleri oluştur
        try {
            await executeQuery('CREATE INDEX IX_refresh_tokens_user_id ON refresh_tokens(user_id)', []);
            console.log('Index IX_refresh_tokens_user_id created.');
        } catch (e) {
            console.log('Index IX_refresh_tokens_user_id already exists or error:', e.message);
        }
        
        try {
            await executeQuery('CREATE INDEX IX_refresh_tokens_token ON refresh_tokens(token)', []);
            console.log('Index IX_refresh_tokens_token created.');
        } catch (e) {
            console.log('Index IX_refresh_tokens_token already exists or error:', e.message);
        }
        
        try {
            await executeQuery('CREATE INDEX IX_refresh_tokens_expires_at ON refresh_tokens(expires_at)', []);
            console.log('Index IX_refresh_tokens_expires_at created.');
        } catch (e) {
            console.log('Index IX_refresh_tokens_expires_at already exists or error:', e.message);
        }
        
        console.log('All indexes created successfully.');
        
    } catch (error) {
        console.error('Error creating refresh_tokens table:', error);
    }
}

createRefreshTokensTable().then(() => {
    console.log('Script completed.');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});