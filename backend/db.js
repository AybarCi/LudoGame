const sql = require('mssql');
const dbConfig = require('./db-config');

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds
    backoffMultiplier: 2
};

// Connection pool with retry logic
let poolPromise = null;

const createConnectionPool = async (retryCount = 0) => {
    try {
        console.log(`[${new Date().toISOString()}] 🔄 Attempting database connection (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries + 1})`);
        
        const pool = new sql.ConnectionPool(dbConfig);
        await pool.connect();
        
        console.log(`[${new Date().toISOString()}] ✅ SQL Server veritabanına başarıyla bağlanıldı.`);
        return pool;
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Veritabanı bağlantı hatası (attempt ${retryCount + 1}):`, err.message);
        
        if (retryCount < RETRY_CONFIG.maxRetries) {
            const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
            console.log(`[${new Date().toISOString()}] ⏳ Retrying in ${delay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return createConnectionPool(retryCount + 1);
        } else {
            console.error(`[${new Date().toISOString()}] 💥 All connection attempts failed. Giving up.`);
            throw err;
        }
    }
};

// Initialize connection pool
const initializePool = () => {
    if (!poolPromise) {
        poolPromise = createConnectionPool().catch(err => {
            console.error('Failed to create initial connection pool:', err);
            poolPromise = null; // Reset so it can be retried
            throw err;
        });
    }
    return poolPromise;
};

// Initialize the pool
initializePool();

// Veritabanı bağlantı durumunu kontrol et
const checkDatabaseConnection = async () => {
    try {
        let pool = await poolPromise;
        
        // If pool is null or connection failed, try to reinitialize
        if (!pool) {
            console.log(`[${new Date().toISOString()}] 🔄 Pool is null, reinitializing...`);
            pool = await initializePool();
        }
        
        if (!pool) {
            return { connected: false, error: 'Pool is undefined after reinitialization' };
        }
        
        await pool.request().query('SELECT 1');
        return { connected: true };
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ❌ Database connection check failed:`, error.message);
        
        // Try to reinitialize the pool on connection failure
        try {
            console.log(`[${new Date().toISOString()}] 🔄 Attempting to reinitialize connection pool...`);
            poolPromise = null; // Reset the promise
            await initializePool();
            return { connected: false, error: `Connection failed but pool reinitialized: ${error.message}` };
        } catch (reinitError) {
            return { connected: false, error: `Connection and reinitialization failed: ${error.message}` };
        }
    }
};

module.exports = {
    checkDatabaseConnection,
    // Sorguları çalıştırmak için bir yardımcı fonksiyon
    executeQuery: async (query, params = []) => {
        let pool;
        let request;
        let retryCount = 0;
        
        while (retryCount <= RETRY_CONFIG.maxRetries) {
            try {
                console.log(`[${new Date().toISOString()}] 🗄️  DB QUERY STARTED: ${query.substring(0, 100)}...`);
                console.log(`[${new Date().toISOString()}] 📋 Parameters:`, JSON.stringify(params, null, 2));
                
                pool = await poolPromise;
                
                // Pool'un tanımlı olduğunu kontrol et
                if (!pool) {
                    console.log(`[${new Date().toISOString()}] 🔄 Pool is null, attempting to reinitialize...`);
                    poolPromise = null;
                    pool = await initializePool();
                }
                
                // Pool nesnesinin request method'unun var olduğunu kontrol et
                if (typeof pool.request !== 'function') {
                    throw new Error('Database pool is not properly initialized. Pool.request is not a function.');
                }
                
                request = pool.request();
                
                // Timeout ayarını ekle
                request.timeout = 60000; // 60 saniye timeout

                // Parametreleri isteğe ekle
                params.forEach(param => {
                    request.input(param.name, param.type, param.value);
                });

                const result = await request.query(query);
                
                console.log(`[${new Date().toISOString()}] ✅ DB QUERY COMPLETED - Rows: ${result.recordset ? result.recordset.length : 0}`);
                
                // For UPDATE/INSERT/DELETE queries, return the full result object
                // For SELECT queries, return just the recordset
                if (query.trim().toUpperCase().startsWith('SELECT')) {
                    return result.recordset;
                } else {
                    return result;
                }
            } catch (error) {
                console.error(`[${new Date().toISOString()}] ❌ DB QUERY ERROR (attempt ${retryCount + 1}):`, error);
                console.error(`[${new Date().toISOString()}] 🔍 Query: ${query}`);
                console.error(`[${new Date().toISOString()}] 📋 Parameters:`, JSON.stringify(params, null, 2));
                
                // Check if this is a connection-related error that we should retry
                const isConnectionError = error.code === 'ETIMEOUT' || 
                                        error.code === 'ECONNRESET' ||
                                        error.code === 'ENOTFOUND' ||
                                        error.message.includes('timeout') ||
                                        error.message.includes('connection') ||
                                        error.message.includes('ECONN');
                
                if (isConnectionError && retryCount < RETRY_CONFIG.maxRetries) {
                    retryCount++;
                    const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount - 1);
                    console.log(`[${new Date().toISOString()}] ⏳ Retrying query in ${delay}ms... (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries + 1})`);
                    
                    // Reset the pool promise to force reconnection
                    poolPromise = null;
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Retry the query
                }
                
                // Timeout hatası mı kontrol et
                if (error.code === 'ETIMEOUT' || error.message.includes('timeout')) {
                    throw new Error(`Database query timeout after 60 seconds. Query: ${query.substring(0, 100)}...`);
                }
                
                // UNIQUE KEY constraint hatası mı kontrol et
                if (error.message && error.message.includes('UNIQUE KEY constraint')) {
                    console.error(`[${new Date().toISOString()}] 🔑 UNIQUE KEY CONSTRAINT VIOLATION DETECTED!`);
                    console.error(`[${new Date().toISOString()}] 🔑 Constraint Details:`, {
                        message: error.message,
                        query: query.substring(0, 200),
                        parameters: params
                    });
                    
                    // Daha açıklayıcı hata mesajı oluştur
                    let userFriendlyMessage = 'Benzersiz kısıtlama ihlali: ';
                    
                    if (error.message.includes('room_code')) {
                        userFriendlyMessage += 'Bu oda kodu zaten kullanılıyor.';
                    } else if (error.message.includes('game_id') && error.message.includes('user_id')) {
                        userFriendlyMessage += 'Bu oyuncu zaten bu oyunda yer alıyor.';
                    } else if (error.message.includes('UQ_game_players_game_user')) {
                        userFriendlyMessage += 'Aynı oyuncu bir odaya sadece bir kez katılabilir.';
                    } else {
                        userFriendlyMessage += 'Bu veri zaten sistemde mevcut.';
                    }
                    
                    const enhancedError = new Error(userFriendlyMessage);
                    enhancedError.originalError = error;
                    enhancedError.constraintType = 'UNIQUE_KEY';
                    enhancedError.queryContext = { query: query.substring(0, 100), params: params };
                    
                    throw enhancedError;
                }
                
                throw error;
            }
        }
    },
    sql // sql nesnesini dışa aktararak veri tiplerine (sql.NVarChar vb.) erişim sağlıyoruz
};
