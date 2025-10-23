const sql = require('mssql');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load database configuration
const dbConfig = require('./db-config.js');

async function setupDatabase() {
    try {
        console.log('🔄 Veritabanı kurulumu başlatılıyor...');
        
        // Try SQL Server first (based on your configuration)
        try {
            console.log('📊 SQL Server bağlantısı deneniyor...');
            
            // Connect to master database first to create the ludoturcodb database
            const masterConfig = { ...dbConfig, database: 'master' };
            const masterPool = await sql.connect(masterConfig);
            
            // Check if database exists
            const dbCheck = await masterPool.request()
                .query(`SELECT name FROM sys.databases WHERE name = 'ludoturcodb'`);
            
            if (dbCheck.recordset.length === 0) {
                console.log('📁 ludoturcodb veritabanı oluşturuluyor...');
                await masterPool.request()
                    .query(`CREATE DATABASE ludoturcodb`);
                console.log('✅ Veritabanı oluşturuldu');
            } else {
                console.log('ℹ️  Veritabanı zaten mevcut');
            }
            
            await masterPool.close();
            
            // Now connect to ludoturcodb and run the schema script
            const pool = await sql.connect(dbConfig);
            
            // Read the SQL script without GO statements
            const sqlScript = fs.readFileSync(path.join(__dirname, 'complete_database_schema_no_go.sql'), 'utf8');
            
            // Split by statements and execute one by one
            const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);
            
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i].trim();
                if (statement && !statement.startsWith('--') && !statement.startsWith('PRINT')) {
                    try {
                        console.log(`📝 Sorgu ${i + 1}/${statements.length} çalıştırılıyor...`);
                        await pool.request().query(statement);
                    } catch (err) {
                        if (err.message.includes('already exists') || err.message.includes('There is already an object')) {
                            console.log(`ℹ️  Sorgu ${i + 1} zaten var, atlanıyor`);
                        } else {
                            console.warn(`⚠️  Sorgu ${i + 1} hatası:`, err.message);
                        }
                    }
                }
            }
            
            await pool.close();
            console.log('✅ SQL Server veritabanı kurulumu tamamlandı!');
            
        } catch (sqlError) {
            console.log('❌ SQL Server bağlantısı başarısız:', sqlError.message);
            console.log('🔄 MySQL deneniyor...');
            
            // Try MySQL
            try {
                const mysqlConfig = {
                    host: dbConfig.server || 'localhost',
                    user: dbConfig.user || 'root',
                    password: dbConfig.password || '',
                    database: 'ludoturcodb'
                };
                
                const connection = await mysql.createConnection(mysqlConfig);
                
                // Read MySQL compatible script
                const mysqlScript = fs.readFileSync(path.join(__dirname, 'complete_database_schema_mysql.sql'), 'utf8');
                
                // Split by statements and execute
                const statements = mysqlScript.split(';').filter(stmt => stmt.trim().length > 0);
                
                for (let i = 0; i < statements.length; i++) {
                    const statement = statements[i].trim();
                    if (statement && !statement.startsWith('--') && !statement.startsWith('SELECT')) {
                        try {
                            console.log(`📝 MySQL sorgu ${i + 1}/${statements.length} çalıştırılıyor...`);
                            await connection.execute(statement);
                        } catch (err) {
                            if (err.message.includes('already exists') || err.message.includes('Duplicate')) {
                                console.log(`ℹ️  Sorgu ${i + 1} zaten var, atlanıyor`);
                            } else {
                                console.warn(`⚠️  Sorgu ${i + 1} hatası:`, err.message);
                            }
                        }
                    }
                }
                
                await connection.end();
                console.log('✅ MySQL veritabanı kurulumu tamamlandı!');
                
            } catch (mysqlError) {
                console.log('❌ MySQL bağlantısı da başarısız:', mysqlError.message);
                console.log('❌ Lütfen veritabanı sunucunuzun çalıştığından emin olun.');
                console.log('💡 Desteklenen sistemler: SQL Server, MySQL');
            }
        }
        
    } catch (error) {
        console.error('❌ Veritabanı kurulumu başarısız:', error.message);
    }
}

// Run the setup
setupDatabase();