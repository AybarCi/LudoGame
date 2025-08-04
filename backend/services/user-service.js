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
    // Bu örnekte, misafir kullanıcılar için geçici değerler kullanıyoruz.
    const newUser = {
        id: userId,
        username: nickname || `guest_${userId.substring(0, 8)}`,
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

module.exports = { findOrCreateUser };
