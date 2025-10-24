module.exports = {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Ca090353--',
    database: process.env.DB_DATABASE || 'LudoGameDB',
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
    requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 60000,
    pool: {
        max: parseInt(process.env.DB_POOL_MAX) || 10,
        min: parseInt(process.env.DB_POOL_MIN) || 0,
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 60000,
        acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT) || 60000
    },
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        connectTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
        requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT) || 60000
    }
};
