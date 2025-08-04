const sql = require('mssql');
const dbConfig = require('./db-config');

async function alterUserTable() {
    let pool;
    try {
        console.log('Veritabanına bağlanılıyor...');
        pool = await sql.connect(dbConfig);
        console.log('Bağlantı başarılı.');

        console.log('Users tablosu değiştiriliyor...');
        const checkAndAddColumnsQuery = `
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'email')
            BEGIN
                ALTER TABLE users ADD email NVARCHAR(255);
            END;

            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash')
            BEGIN
                ALTER TABLE users ADD password_hash NVARCHAR(255);
            END;

            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'nickname')
            BEGIN
                ALTER TABLE users ADD nickname NVARCHAR(50);
            END;

            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'score')
            BEGIN
                ALTER TABLE users ADD score INT DEFAULT 0;
            END;

            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'games_played')
            BEGIN
                ALTER TABLE users ADD games_played INT DEFAULT 0;
            END;

            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'wins')
            BEGIN
                ALTER TABLE users ADD wins INT DEFAULT 0;
            END;
        `;

        await pool.request().query(checkAndAddColumnsQuery);
        console.log('Users tablosu başarıyla değiştirildi veya zaten günceldi.');

    } catch (err) {
        console.error('Tablo değiştirilirken hata oluştu:', err);
    } finally {
        if (pool) {
            pool.close();
            console.log('Veritabanı bağlantısı kapatıldı.');
        }
    }
}

alterUserTable();
