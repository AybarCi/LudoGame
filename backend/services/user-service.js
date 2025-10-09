const { executeQuery, sql } = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Verilen userId ile bir kullanıcı bulur veya yoksa oluşturur.
 * Bu, misafir kullanıcıların bile veritabanında bir kaydının olmasını sağlar.
 * @param {string} userId - İstemciden gelen kullanıcı ID'si.
 * @param {string} nickname - İstemciden gelen kullanıcı adı.
 * @returns {Promise<object>} Veritabanındaki kullanıcı nesnesi.
 */
const findOrCreateUser = async (userId, nickname) => {
    if (!userId) {
        userId = uuidv4(); // Eğer bir ID gelmezse, misafir için yeni bir tane oluştur.
    }

    // 1. Kullanıcı var mı diye kontrol et
    let user = await executeQuery('SELECT * FROM users WHERE id = @userId', [
        { name: 'userId', type: sql.NVarChar(36), value: userId }
    ]);

    if (user && user.length > 0) {
        return user[0]; // Kullanıcı bulundu, döndür.
    }

    // 2. Kullanıcı yoksa, yeni bir tane oluştur
    // Not: Gerçek bir sistemde şifreler güvenli bir şekilde hash'lenmelidir.
    // Bu örnekte, misafir kullanıcılar için geçili değerler kullanıyoruz.
    
    // Misafir kullanıcılar için benzersiz username oluştur
    let username = nickname;
    if (!username || username.startsWith('guest_')) {
        // Tam UUID'yi kullanarak çakışma olasılığını minimize et
        username = `guest_${userId}`;
    }
    
    // Username çakışmasını kontrol et ve gerekirse sayı ekle
    let finalUsername = username;
    let attempt = 0;
    const maxAttempts = 10;
    
    while (attempt < maxAttempts) {
        try {
            // Bu username zaten var mı kontrol et
            const existingUser = await executeQuery('SELECT id FROM users WHERE username = @username', [
                { name: 'username', type: sql.NVarChar(50), value: finalUsername }
            ]);
            
            if (!existingUser || existingUser.length === 0) {
                // Username kullanılabilir, devam et
                break;
            }
            
            // Username zaten var, yeni bir deneme yap
            attempt++;
            finalUsername = `${username}_${attempt}`;
            
        } catch (error) {
            console.error(`[findOrCreateUser] Username kontrol hatası (attempt ${attempt}):`, error);
            break; // Kontrol edemediysek devam et
        }
    }
    
    const newUser = {
        id: userId,
        username: finalUsername,
        email: `${userId}@ludo.guest`,
        password_hash: 'not_set',
        salt: 'not_set',
        is_active: true
    };

    const query = `
        INSERT INTO users (id, username, email, password_hash, salt, is_active)
        VALUES (@id, @username, @email, @password_hash, @salt, @is_active);
    `;

    await executeQuery(query, [
        { name: 'id', type: sql.NVarChar(36), value: newUser.id },
        { name: 'username', type: sql.NVarChar(50), value: newUser.username },
        { name: 'email', type: sql.NVarChar(255), value: newUser.email },
        { name: 'password_hash', type: sql.NVarChar(255), value: newUser.password_hash },
        { name: 'salt', type: sql.NVarChar(255), value: newUser.salt },
        { name: 'is_active', type: sql.Bit, value: newUser.is_active },
    ]);

    // Yeni kullanıcı için bir istatistik kaydı da oluşturalım.
    const statsQuery = 'INSERT INTO player_statistics (user_id) VALUES (@user_id)';
    await executeQuery(statsQuery, [{ name: 'user_id', type: sql.NVarChar(36), value: newUser.id }]);

    return newUser;
};

/**
 * Kullanıcının avatar URL'sini günceller
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} avatarUrl - Yeni avatar URL'si
 * @returns {Promise<boolean>} Güncelleme başarılı mı
 */
const updateUserAvatar = async (userId, avatarUrl) => {
    try {
        console.log(`[updateUserAvatar] Güncelleme başlatıldı - UserId: ${userId}, Avatar uzunluğu: ${avatarUrl.length}`);
        
        const query = `
            UPDATE users 
            SET avatar_url = @avatarUrl, updated_at = GETDATE()
            WHERE id = @userId
        `;
        
        // Use executeQuery but handle the result correctly for UPDATE operations
        const result = await executeQuery(query, [
            { name: 'userId', type: sql.NVarChar(36), value: userId },
            { name: 'avatarUrl', type: sql.NVarChar(500), value: avatarUrl }
        ]);
        
        // For UPDATE queries, executeQuery now returns the full result object
        console.log(`[updateUserAvatar] Sorgu sonucu - rowsAffected: ${result.rowsAffected}`);
        return result.rowsAffected > 0;
    } catch (error) {
        console.error('Avatar güncelleme hatası:', error);
        return false;
    }
};

/**
 * Kullanıcının avatar URL'sini getirir
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<string|null>} Avatar URL'si veya null
 */
const getUserAvatar = async (userId) => {
    try {
        const result = await executeQuery(
            'SELECT avatar_url FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: userId }]
        );
        
        if (result && result.length > 0) {
            return result[0].avatar_url;
        }
        return null;
    } catch (error) {
        console.error('Avatar getirme hatası:', error);
        return null;
    }
};

module.exports = { findOrCreateUser, updateUserAvatar, getUserAvatar };
