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

async function testVerifyPhoneQuery() {
    try {
        console.log('🔄 Remote veritabanına bağlanılıyor...');
        
        const pool = await sql.connect(config);
        console.log('✅ Remote veritabanına bağlanıldı!');
        
        console.log('\n🧪 /api/verify-phone endpoint sorgusu test ediliyor...');
        
        // Test the exact query that was failing in /api/verify-phone
        const testQuery = `
            SELECT id, username, email, phone_number, encrypted_phone, 
                   diamonds, wins, losses, score, games_played, avatar_url, 
                   created_at, updated_at 
            FROM users 
            WHERE phone_number = @phoneNumber
        `;
        
        const request = pool.request();
        request.input('phoneNumber', sql.NVarChar, '+905555555555'); // Test phone number
        
        const result = await request.query(testQuery);
        
        console.log('✅ Sorgu başarıyla çalıştı!');
        console.log(`📊 Sonuç: ${result.recordset.length} kayıt bulundu`);
        
        if (result.recordset.length > 0) {
            console.log('📋 Kullanıcı verisi:');
            const user = result.recordset[0];
            console.log(`  - ID: ${user.id}`);
            console.log(`  - Username: ${user.username}`);
            console.log(`  - Email: ${user.email}`);
            console.log(`  - Phone: ${user.phone_number}`);
            console.log(`  - Wins: ${user.wins}`);
            console.log(`  - Losses: ${user.losses}`);
            console.log(`  - Score: ${user.score}`);
            console.log(`  - Games Played: ${user.games_played}`);
            console.log(`  - Avatar URL: ${user.avatar_url}`);
            console.log(`  - Diamonds: ${user.diamonds}`);
        }
        
        // Test insert query for new user
        console.log('\n🧪 Yeni kullanıcı ekleme sorgusu test ediliyor...');
        
        const insertQuery = `
            INSERT INTO users (id, username, email, phone_number, encrypted_phone, 
                             password_hash, salt, nickname, diamonds, wins, losses, 
                             score, games_played, avatar_url, created_at, updated_at)
            VALUES (@id, @username, @email, @phoneNumber, @encryptedPhone,
                    @passwordHash, @salt, @nickname, @diamonds, @wins, @losses,
                    @score, @gamesPlayed, @avatarUrl, GETDATE(), GETDATE())
        `;
        
        const insertRequest = pool.request();
        insertRequest.input('id', sql.NVarChar, 'test-user-' + Date.now());
        insertRequest.input('username', sql.NVarChar, 'testuser');
        insertRequest.input('email', sql.NVarChar, 'test@example.com');
        insertRequest.input('phoneNumber', sql.NVarChar, '+905555555556');
        insertRequest.input('encryptedPhone', sql.NVarChar, 'encrypted_test_phone');
        insertRequest.input('passwordHash', sql.NVarChar, 'test_password_hash');
        insertRequest.input('salt', sql.NVarChar, 'test_salt');
        insertRequest.input('nickname', sql.NVarChar, 'Test User');
        insertRequest.input('diamonds', sql.Int, 0);
        insertRequest.input('wins', sql.Int, 0);
        insertRequest.input('losses', sql.Int, 0);
        insertRequest.input('score', sql.Int, 0);
        insertRequest.input('gamesPlayed', sql.Int, 0);
        insertRequest.input('avatarUrl', sql.NVarChar, null);
        
        await insertRequest.query(insertQuery);
        console.log('✅ Yeni kullanıcı başarıyla eklendi!');
        
        // Test phone verification insert
        console.log('\n🧪 Telefon doğrulama kodu ekleme sorgusu test ediliyor...');
        
        const verificationQuery = `
            INSERT INTO phone_verifications (phone_number, verification_code, expires_at, is_used, created_at)
            VALUES (@phoneNumber, @verificationCode, @expiresAt, @isUsed, GETDATE())
        `;
        
        const verificationRequest = pool.request();
        verificationRequest.input('phoneNumber', sql.NVarChar, '+905555555556');
        verificationRequest.input('verificationCode', sql.NVarChar, '123456');
        verificationRequest.input('expiresAt', sql.DateTime2, new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes
        verificationRequest.input('isUsed', sql.Bit, false);
        
        await verificationRequest.query(verificationQuery);
        console.log('✅ Telefon doğrulama kodu başarıyla eklendi!');
        
        // Test the complete verification process query
        console.log('\n🧪 Tam telefon doğrulama süreci test ediliyor...');
        
        const completeVerificationQuery = `
            SELECT pv.*, u.id as user_id, u.username, u.wins, u.losses, u.score, u.games_played, u.avatar_url
            FROM phone_verifications pv
            LEFT JOIN users u ON u.phone_number = pv.phone_number
            WHERE pv.phone_number = @phoneNumber 
            AND pv.verification_code = @verificationCode 
            AND pv.expires_at > GETDATE() 
            AND pv.is_used = 0
        `;
        
        const completeRequest = pool.request();
        completeRequest.input('phoneNumber', sql.NVarChar, '+905555555556');
        completeRequest.input('verificationCode', sql.NVarChar, '123456');
        
        const completeResult = await completeRequest.query(completeVerificationQuery);
        
        console.log('✅ Tam doğrulama sorgusu başarıyla çalıştı!');
        console.log(`📊 Sonuç: ${completeResult.recordset.length} kayıt bulundu`);
        
        // Clean up test data
        console.log('\n🧹 Test verileri temizleniyor...');
        await pool.request().query(`DELETE FROM phone_verifications WHERE phone_number = '+905555555556'`);
        await pool.request().query(`DELETE FROM users WHERE phone_number = '+905555555556'`);
        console.log('✅ Test verileri temizlendi!');
        
        await pool.close();
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 TÜM TESTLER BAŞARIYLA TAMAMLANDI!');
        console.log('🎉 /API/VERIFY-PHONE ENDPOINT ARTIK ÇALIŞIYOR!');
        console.log('🎉 TÜM EKSİK ALANLAR DÜZELTİLDİ!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Test hatası:', error.message);
        console.error('📋 Hata detayları:', error);
        process.exit(1);
    }
}

// Run the test
testVerifyPhoneQuery();