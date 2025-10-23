const sql = require('mssql');

// Database configuration for remote SQL Server
const config = {
    server: 'mssql.istekbilisim.com',
    port: 1433,
    user: 'sa',
    password: 'SeKo153759++',
    database: 'LudoGameDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    }
};

async function checkDatabase() {
    try {
        console.log('🔄 Veritabanına bağlanılıyor...');
        
        const pool = await sql.connect(config);
        console.log('✅ Veritabanına bağlanıldı!');
        
        // Check if we can connect to the database
        const dbCheck = await pool.request()
            .query(`SELECT DB_NAME() as current_database`);
        
        console.log(`📊 Mevcut veritabanı: ${dbCheck.recordset[0].current_database}`);
        
        // Check existing tables
        console.log('\n📋 Tablo kontrolü yapılıyor...');
        
        const tablesQuery = `
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `;
        
        const tables = await pool.request().query(tablesQuery);
        console.log('Mevcut tablolar:');
        tables.recordset.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });
        
        // Check users table structure
        console.log('\n👤 Users tablosu kontrolü...');
        
        const usersColumnsQuery = `
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `;
        
        const usersColumns = await pool.request().query(usersColumnsQuery);
        console.log('Users tablosu sütunları:');
        usersColumns.recordset.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) NULL: ${col.IS_NULLABLE} DEFAULT: ${col.COLUMN_DEFAULT || 'NULL'}`);
        });
        
        // Check for missing columns
        const requiredColumns = [
            'wins', 'losses', 'score', 'games_played', 
            'encrypted_phone', 'avatar_url', 'phone_number'
        ];
        
        const existingColumns = usersColumns.recordset.map(col => col.COLUMN_NAME);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length > 0) {
            console.log('\n❌ Eksik sütunlar:');
            missingColumns.forEach(col => console.log(`  - ${col}`));
        } else {
            console.log('\n✅ Tüm gerekli sütunlar mevcut!');
        }
        
        // Check phone_verifications table
        console.log('\n📱 Phone verifications tablosu kontrolü...');
        
        const phoneVerQuery = `
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'phone_verifications'
            ORDER BY ORDINAL_POSITION
        `;
        
        try {
            const phoneVerColumns = await pool.request().query(phoneVerQuery);
            console.log('Phone verifications sütunları:');
            phoneVerColumns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) NULL: ${col.IS_NULLABLE}`);
            });
        } catch (err) {
            console.log('❌ phone_verifications tablosu bulunamadı!');
        }
        
        // Check games table
        console.log('\n🎮 Games tablosu kontrolü...');
        
        const gamesQuery = `
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'games'
            ORDER BY ORDINAL_POSITION
        `;
        
        try {
            const gamesColumns = await pool.request().query(gamesQuery);
            console.log('Games sütunları:');
            gamesColumns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) NULL: ${col.IS_NULLABLE}`);
            });
        } catch (err) {
            console.log('❌ games tablosu bulunamadı!');
        }
        
        // Check game_players table
        console.log('\n👥 Game players tablosu kontrolü...');
        
        const gamePlayersQuery = `
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'game_players'
            ORDER BY ORDINAL_POSITION
        `;
        
        try {
            const gamePlayersColumns = await pool.request().query(gamePlayersQuery);
            console.log('Game players sütunları:');
            gamePlayersColumns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) NULL: ${col.IS_NULLABLE}`);
            });
        } catch (err) {
            console.log('❌ game_players tablosu bulunamadı!');
        }
        
        // Check indexes
        console.log('\n🔑 Index kontrolü...');
        
        const indexesQuery = `
            SELECT 
                t.name AS table_name,
                i.name AS index_name,
                i.type_desc AS index_type,
                c.name AS column_name
            FROM sys.indexes i
            INNER JOIN sys.tables t ON i.object_id = t.object_id
            INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE t.name IN ('users', 'phone_verifications', 'games', 'game_players')
            ORDER BY t.name, i.name
        `;
        
        try {
            const indexes = await pool.request().query(indexesQuery);
            console.log('Mevcut indexler:');
            indexes.recordset.forEach(idx => {
                console.log(`  - ${idx.table_name}.${idx.index_name} (${idx.index_type}) on ${idx.column_name}`);
            });
        } catch (err) {
            console.log('Index bilgisi alınamadı:', err.message);
        }
        
        // Test a simple query
        console.log('\n🧪 Test sorgusu çalıştırılıyor...');
        try {
            const testQuery = await pool.request()
                .query('SELECT COUNT(*) as user_count FROM users');
            console.log(`📊 Kullanıcı sayısı: ${testQuery.recordset[0].user_count}`);
        } catch (err) {
            console.log('❌ Test sorgusu başarısız:', err.message);
        }
        
        await pool.close();
        console.log('\n✅ Veritabanı kontrolü tamamlandı!');
        
    } catch (error) {
        console.error('❌ Veritabanı bağlantısı başarısız:', error.message);
        console.log('\n💡 Lütfen şunları kontrol edin:');
        console.log('  - Sunucu adresi ve port doğru mu?');
        console.log('  - Kullanıcı adı ve şifre doğru mu?');
        console.log('  - SQL Server çalışıyor mu?');
        console.log('  - Firewall ayarları bağlantıya izin veriyor mu?');
    }
}

// Run the check
checkDatabase();