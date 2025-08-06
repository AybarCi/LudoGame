-- Users tablosuna diamonds alanı ekleme
ALTER TABLE users ADD diamonds INT DEFAULT 0;

-- Mevcut kullanıcılara başlangıç elması verme (opsiyonel)
UPDATE users SET diamonds = 10 WHERE diamonds IS NULL;