const { executeQuery, sql } = require('./db');

async function checkUsersTable() {
    try {
        // Check if updated_at column exists
        const columnCheck = await executeQuery(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = 'dbo'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('Users table columns:');
        columnCheck.forEach(col => {
            console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})`);
        });
        
        // Check if avatar_url column exists
        const avatarColumn = await executeQuery(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar_url'
        `);
        
        if (avatarColumn.length > 0) {
            console.log(`\navatar_url column exists: ${avatarColumn[0].DATA_TYPE}(${avatarColumn[0].CHARACTER_MAXIMUM_LENGTH})`);
        } else {
            console.log('\navatar_url column does NOT exist!');
        }
        
        // Check specific user
        const userCheck = await executeQuery(
            'SELECT id, username, avatar_url FROM users WHERE id = @userId',
            [{ name: 'userId', type: sql.NVarChar(36), value: '5a8ed8dc-0a98-4ec5-acc0-a5c49184f007' }]
        );
        
        console.log(`\nUser check result: ${userCheck.length} users found`);
        if (userCheck.length > 0) {
            console.log('User data:', userCheck[0]);
        }
        
    } catch (error) {
        console.error('Error checking table:', error);
    }
}

checkUsersTable();