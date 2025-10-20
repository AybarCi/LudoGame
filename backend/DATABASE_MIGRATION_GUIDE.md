# 📱 Telefon Numarası Şifreleme - Veritabanı Güncelleme Rehberi

## 🔧 Veritabanı Alanını Güncelleme

### Yöntem 1: SQL Server Management Studio (Önerilen)

1. **SQL Server Management Studio (SSMS)'yi açın**
2. **LudoDB veritabanına bağlanın**
3. **Yeni Query penceresi açın**
4. **Aşağıdaki SQL komutlarını sırayla çalıştırın:**

```sql
-- 1. encrypted_phone sütununu ekle
ALTER TABLE users ADD encrypted_phone NVARCHAR(255);

-- 2. phone_number sütununu NVARCHAR(255) olarak güncelle ve nullable yap
ALTER TABLE users ALTER COLUMN phone_number NVARCHAR(255) NULL;

-- 3. encrypted_phone için index oluştur
CREATE INDEX IX_users_encrypted_phone ON users(encrypted_phone);
```

### Yöntem 2: Node.js Script ile

```bash
# Backend klasörüne git
cd /Users/cihanaybar/Projects/Ludo/backend

# Migration script'ini çalıştır
node run-migration.js
```

### Yöntem 3: sqlcmd ile

```bash
# Terminal'den doğrudan çalıştır
sqlcmd -S 192.168.1.134 -U sa -P "Ca090353--" -d ludoturcodb -i "migrations/simple_encrypt_phone_migration.sql"
```

## 🔍 Kontrol Adımları

### Güncelleme Sonrası Kontrol:

```sql
-- Tablo yapısını kontrol et
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
ORDER BY ORDINAL_POSITION;

-- Index'leri kontrol et
SELECT 
    i.name AS IndexName,
    c.name AS ColumnName
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('users')
ORDER BY i.name;
```

## ⚠️ Önemli Uyarılar

1. **Backup Alın**: Güncelleme öncesi veritabanı yedeği alın
2. **Test Ortamı**: Önce test ortamında deneyin
3. **Constraint'ler**: phone_number üzerindeki unique constraint'ler kaldırılacak
4. **Mevcut Veriler**: Mevcut telefon numaraları encrypt-phone-numbers.js ile şifrelenecek

## 🚀 Sonraki Adımlar

1. **Veritabanı güncelleme tamamlandıktan sonra:**
   ```bash
   # Mevcut telefon numaralarını şifrele
   node migrations/encrypt-phone-numbers.js
   ```

2. **Backend sunucusunu yeniden başlat:**
   ```bash
   # Backend sunucusunu yeniden başlat
   npm start
   ```

## 📋 Hata Giderme

### Eğer "Column already exists" hatası alırsanız:
```sql
-- encrypted_phone sütunu varsa atla
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'encrypted_phone')
BEGIN
    ALTER TABLE users ADD encrypted_phone NVARCHAR(255);
END
```

### Eğer bağlantı hatası alırsanız:
- Veritabanı sunucusunun çalıştığından emin olun
- Bağlantı bilgilerini kontrol edin (.env dosyası)
- Firewall ayarlarını kontrol edin

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Hata mesajını kaydedin
2. Mevcut tablo yapısını kontrol edin
3. Backend loglarını inceleyin