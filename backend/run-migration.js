// Veritabanı migration script'ini çalıştırmak için yardımcı script
const fs = require('fs');
const path = require('path');

// Migration SQL script'ini oku
const migrationPath = path.join(__dirname, 'migrations', '20241105_encrypt_phone_numbers.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Migration SQL Script:');
console.log('========================');
console.log(migrationSQL);
console.log('========================');

// Manuel migration adımları
console.log('\n🔧 Manuel Migration Adımları:');
console.log('1. SQL Server Management Studio (SSMS) veya benzeri bir araç kullan');
console.log('2. Aşağıdaki SQL komutlarını çalıştır:');
console.log('');

// Sadece temel SQL komutlarını ayıkla
const basicCommands = migrationSQL
  .split('GO')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'))
  .map(cmd => cmd.replace(/PRINT\s+'.+';?/g, ''))
  .filter(cmd => cmd.trim().length > 0);

basicCommands.forEach((cmd, index) => {
  console.log(`-- Adım ${index + 1}:`);
  console.log(cmd + ';');
  console.log('');
});

console.log('\n💡 Alternatif olarak:');
console.log('- Bu script dosyasını SQL Server Management Studio da açabilir');
console.log('- Veya sqlcmd aracı ile çalıştırabilirsiniz:');
console.log(`  sqlcmd -S localhost -U sa -P "YourPassword" -d YourDatabase -i "${migrationPath}"`);

// Node.js ile migration çalıştırma fonksiyonu
async function runMigration() {
    const sql = require('mssql');
    const dbConfig = require('./db-config');
    
    try {
        console.log('\n🚀 Migration başlatılıyor...');
        await sql.connect(dbConfig);
        
        // Komutları tek tek çalıştır
        for (const command of basicCommands) {
            try {
                console.log(`Çalıştırılıyor: ${command.substring(0, 50)}...`);
                await sql.query(command);
                console.log('✅ Başarılı');
            } catch (error) {
                console.error('❌ Hata:', error.message);
                // Constraint veya index hatalarında devam et
                if (error.message.includes('already exists') || error.message.includes('zaten var')) {
                    console.log('⚠️  Zaten var, devam ediliyor...');
                    continue;
                }
                throw error;
            }
        }
        
        console.log('\n🎉 Migration tamamlandı!');
        
    } catch (error) {
        console.error('Migration hatası:', error);
    } finally {
        await sql.close();
    }
}

// Manuel çalıştırma
if (require.main === module) {
    console.log('\n🔄 Migration çalıştırılsın mı? (E/H)');
    console.log('Not: Veritabanı bağlantısı gerekiyor');
    
    // Manuel olarak çalıştırmak isterseniz:
    // runMigration();
}