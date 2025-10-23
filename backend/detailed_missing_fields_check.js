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

async function checkMissingFields() {
    try {
        console.log('🔄 Veritabanına bağlanılıyor...');
        
        const pool = await sql.connect(config);
        console.log('✅ Veritabanına bağlanıldı!');
        
        // Check users table structure in detail
        console.log('\n👤 USERS TABLOSU DETAYLI KONTROLÜ...');
        
        const usersColumnsQuery = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `;
        
        const usersColumns = await pool.request().query(usersColumnsQuery);
        console.log('\nUsers tablosu mevcut sütunları:');
        usersColumns.recordset.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) NULL: ${col.IS_NULLABLE} DEFAULT: ${col.COLUMN_DEFAULT || 'NULL'}`);
        });
        
        // Check for missing columns in users table
        const requiredUsersColumns = [
            'id', 'email', 'password_hash', 'username', 'nickname', 
            'phone_number', 'encrypted_phone', 'salt', 'score', 
            'games_played', 'wins', 'losses', 'avatar_url', 
            'diamonds', 'created_at', 'updated_at'
        ];
        
        const existingUsersColumns = usersColumns.recordset.map(col => col.COLUMN_NAME);
        const missingUsersColumns = requiredUsersColumns.filter(col => !existingUsersColumns.includes(col));
        
        console.log('\n❌ USERS TABLOSUNDA EKSİK SÜTUNLAR:');
        if (missingUsersColumns.length > 0) {
            missingUsersColumns.forEach(col => console.log(`  - ${col}`));
        } else {
            console.log('  - Tüm gerekli sütunlar mevcut');
        }
        
        // Check games table structure
        console.log('\n🎮 GAMES TABLOSU DETAYLI KONTROLÜ...');
        
        const gamesColumnsQuery = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'games'
            ORDER BY ORDINAL_POSITION
        `;
        
        try {
            const gamesColumns = await pool.request().query(gamesColumnsQuery);
            console.log('\nGames tablosu mevcut sütunları:');
            gamesColumns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) NULL: ${col.IS_NULLABLE} DEFAULT: ${col.COLUMN_DEFAULT || 'NULL'}`);
            });
            
            // Check for missing columns in games table
            const requiredGamesColumns = [
                'id', 'room_code', 'host_id', 'status', 'current_player',
                'winner_id', 'game_data', 'created_at', 'updated_at'
            ];
            
            const existingGamesColumns = gamesColumns.recordset.map(col => col.COLUMN_NAME);
            const missingGamesColumns = requiredGamesColumns.filter(col => !existingGamesColumns.includes(col));
            
            console.log('\n❌ GAMES TABLOSUNDA EKSİK SÜTUNLAR:');
            if (missingGamesColumns.length > 0) {
                missingGamesColumns.forEach(col => console.log(`  - ${col}`));
            } else {
                console.log('  - Tüm gerekli sütunlar mevcut');
            }
        } catch (err) {
            console.log('❌ Games tablosu bulunamadı!');
        }
        
        // Check game_players table structure
        console.log('\n👥 GAME_PLAYERS TABLOSU DETAYLI KONTROLÜ...');
        
        const gamePlayersColumnsQuery = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'game_players'
            ORDER BY ORDINAL_POSITION
        `;
        
        try {
            const gamePlayersColumns = await pool.request().query(gamePlayersColumnsQuery);
            console.log('\nGame_players tablosu mevcut sütunları:');
            gamePlayersColumns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) NULL: ${col.IS_NULLABLE} DEFAULT: ${col.COLUMN_DEFAULT || 'NULL'}`);
            });
            
            // Check for missing columns in game_players table
            const requiredGamePlayersColumns = [
                'id', 'game_id', 'user_id', 'position', 'color',
                'player_order', 'is_ready', 'socket_id', 'is_bot',
                'bot_difficulty', 'score', 'created_at', 'updated_at'
            ];
            
            const existingGamePlayersColumns = gamePlayersColumns.recordset.map(col => col.COLUMN_NAME);
            const missingGamePlayersColumns = requiredGamePlayersColumns.filter(col => !existingGamePlayersColumns.includes(col));
            
            console.log('\n❌ GAME_PLAYERS TABLOSUNDA EKSİK SÜTUNLAR:');
            if (missingGamePlayersColumns.length > 0) {
                missingGamePlayersColumns.forEach(col => console.log(`  - ${col}`));
            } else {
                console.log('  - Tüm gerekli sütunlar mevcut');
            }
        } catch (err) {
            console.log('❌ Game_players tablosu bulunamadı!');
        }
        
        // Check phone_verifications table structure
        console.log('\n📱 PHONE_VERIFICATIONS TABLOSU DETAYLI KONTROLÜ...');
        
        const phoneVerColumnsQuery = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'phone_verifications'
            ORDER BY ORDINAL_POSITION
        `;
        
        try {
            const phoneVerColumns = await pool.request().query(phoneVerColumnsQuery);
            console.log('\nPhone_verifications tablosu mevcut sütunları:');
            phoneVerColumns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) NULL: ${col.IS_NULLABLE} DEFAULT: ${col.COLUMN_DEFAULT || 'NULL'}`);
            });
            
            // Check for missing columns in phone_verifications table
            const requiredPhoneVerColumns = [
                'id', 'phone_number', 'verification_code', 'expires_at', 'is_used', 'created_at'
            ];
            
            const existingPhoneVerColumns = phoneVerColumns.recordset.map(col => col.COLUMN_NAME);
            const missingPhoneVerColumns = requiredPhoneVerColumns.filter(col => !existingPhoneVerColumns.includes(col));
            
            console.log('\n❌ PHONE_VERIFICATIONS TABLOSUNDA EKSİK SÜTUNLAR:');
            if (missingPhoneVerColumns.length > 0) {
                missingPhoneVerColumns.forEach(col => console.log(`  - ${col}`));
            } else {
                console.log('  - Tüm gerekli sütunlar mevcut');
            }
        } catch (err) {
            console.log('❌ Phone_verifications tablosu bulunamadı!');
        }
        
        // Check refresh_tokens table structure
        console.log('\n🔑 REFRESH_TOKENS TABLOSU DETAYLI KONTROLÜ...');
        
        const refreshTokensColumnsQuery = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'refresh_tokens'
            ORDER BY ORDINAL_POSITION
        `;
        
        try {
            const refreshTokensColumns = await pool.request().query(refreshTokensColumnsQuery);
            console.log('\nRefresh_tokens tablosu mevcut sütunları:');
            refreshTokensColumns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) NULL: ${col.IS_NULLABLE} DEFAULT: ${col.COLUMN_DEFAULT || 'NULL'}`);
            });
            
            // Check for missing columns in refresh_tokens table
            const requiredRefreshTokensColumns = [
                'id', 'user_id', 'token', 'expires_at', 'created_at'
            ];
            
            const existingRefreshTokensColumns = refreshTokensColumns.recordset.map(col => col.COLUMN_NAME);
            const missingRefreshTokensColumns = requiredRefreshTokensColumns.filter(col => !existingRefreshTokensColumns.includes(col));
            
            console.log('\n❌ REFRESH_TOKENS TABLOSUNDA EKSİK SÜTUNLAR:');
            if (missingRefreshTokensColumns.length > 0) {
                missingRefreshTokensColumns.forEach(col => console.log(`  - ${col}`));
            } else {
                console.log('  - Tüm gerekli sütunlar mevcut');
            }
        } catch (err) {
            console.log('❌ Refresh_tokens tablosu bulunamadı!');
        }
        
        // Check UserPawns table structure
        console.log('\n♟️  USERPAWNS TABLOSU DETAYLI KONTROLÜ...');
        
        const userPawnsColumnsQuery = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'UserPawns'
            ORDER BY ORDINAL_POSITION
        `;
        
        try {
            const userPawnsColumns = await pool.request().query(userPawnsColumnsQuery);
            console.log('\nUserPawns tablosu mevcut sütunları:');
            userPawnsColumns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) NULL: ${col.IS_NULLABLE} DEFAULT: ${col.COLUMN_DEFAULT || 'NULL'}`);
            });
            
            // Check for missing columns in UserPawns table
            const requiredUserPawnsColumns = [
                'id', 'user_id', 'pawn_type', 'color', 'position_x', 
                'position_y', 'is_active', 'created_at', 'updated_at'
            ];
            
            const existingUserPawnsColumns = userPawnsColumns.recordset.map(col => col.COLUMN_NAME);
            const missingUserPawnsColumns = requiredUserPawnsColumns.filter(col => !existingUserPawnsColumns.includes(col));
            
            console.log('\n❌ USERPAWNS TABLOSUNDA EKSİK SÜTUNLAR:');
            if (missingUserPawnsColumns.length > 0) {
                missingUserPawnsColumns.forEach(col => console.log(`  - ${col}`));
            } else {
                console.log('  - Tüm gerekli sütunlar mevcut');
            }
        } catch (err) {
            console.log('❌ UserPawns tablosu bulunamadı!');
        }
        
        // Check game_sessions table structure
        console.log('\n🎮 GAME_SESSIONS TABLOSU DETAYLI KONTROLÜ...');
        
        const gameSessionsColumnsQuery = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'game_sessions'
            ORDER BY ORDINAL_POSITION
        `;
        
        try {
            const gameSessionsColumns = await pool.request().query(gameSessionsColumnsQuery);
            console.log('\nGame_sessions tablosu mevcut sütunları:');
            gameSessionsColumns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) NULL: ${col.IS_NULLABLE} DEFAULT: ${col.COLUMN_DEFAULT || 'NULL'}`);
            });
            
            // Check for missing columns in game_sessions table
            const requiredGameSessionsColumns = [
                'id', 'game_id', 'user_id', 'session_data', 'created_at', 'updated_at'
            ];
            
            const existingGameSessionsColumns = gameSessionsColumns.recordset.map(col => col.COLUMN_NAME);
            const missingGameSessionsColumns = requiredGameSessionsColumns.filter(col => !existingGameSessionsColumns.includes(col));
            
            console.log('\n❌ GAME_SESSIONS TABLOSUNDA EKSİK SÜTUNLAR:');
            if (missingGameSessionsColumns.length > 0) {
                missingGameSessionsColumns.forEach(col => console.log(`  - ${col}`));
            } else {
                console.log('  - Tüm gerekli sütunlar mevcut');
            }
        } catch (err) {
            console.log('❌ Game_sessions tablosu bulunamadı!');
        }
        
        // Check game_participants table structure
        console.log('\n👥 GAME_PARTICIPANTS TABLOSU DETAYLI KONTROLÜ...');
        
        const gameParticipantsColumnsQuery = `
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                IS_NULLABLE, 
                COLUMN_DEFAULT,
                CHARACTER_MAXIMUM_LENGTH,
                NUMERIC_PRECISION,
                NUMERIC_SCALE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'game_participants'
            ORDER BY ORDINAL_POSITION
        `;
        
        try {
            const gameParticipantsColumns = await pool.request().query(gameParticipantsColumnsQuery);
            console.log('\nGame_participants tablosu mevcut sütunları:');
            gameParticipantsColumns.recordset.forEach(col => {
                console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) NULL: ${col.IS_NULLABLE} DEFAULT: ${col.COLUMN_DEFAULT || 'NULL'}`);
            });
            
            // Check for missing columns in game_participants table
            const requiredGameParticipantsColumns = [
                'id', 'game_id', 'user_id', 'player_order', 'color', 'status', 'created_at', 'updated_at'
            ];
            
            const existingGameParticipantsColumns = gameParticipantsColumns.recordset.map(col => col.COLUMN_NAME);
            const missingGameParticipantsColumns = requiredGameParticipantsColumns.filter(col => !existingGameParticipantsColumns.includes(col));
            
            console.log('\n❌ GAME_PARTICIPANTS TABLOSUNDA EKSİK SÜTUNLAR:');
            if (missingGameParticipantsColumns.length > 0) {
                missingGameParticipantsColumns.forEach(col => console.log(`  - ${col}`));
            } else {
                console.log('  - Tüm gerekli sütunlar mevcut');
            }
        } catch (err) {
            console.log('❌ Game_participants tablosu bulunamadı!');
        }
        
        await pool.close();
        console.log('\n✅ Detaylı veritabanı kontrolü tamamlandı!');
        
    } catch (error) {
        console.error('❌ Veritabanı bağlantısı başarısız:', error.message);
    }
}

// Run the check
checkMissingFields();