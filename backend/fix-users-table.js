const { executeQuery, sql } = require('./db');

async function addUpdatedAtColumn() {
    try {
        // Check if updated_at column exists
        const columnExists = await executeQuery(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at'
        `);
        
        if (columnExists[0].count === 0) {
            console.log('Adding updated_at column to users table...');
            
            // Add the updated_at column
            await executeQuery(`
                ALTER TABLE users 
                ADD updated_at DATETIME2 DEFAULT GETDATE()
            `);
            
            console.log('✅ updated_at column added successfully');
        } else {
            console.log('updated_at column already exists');
        }
        
        // Also check for nickname column
        const nicknameExists = await executeQuery(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'nickname'
        `);
        
        if (nicknameExists[0].count === 0) {
            console.log('Adding nickname column to users table...');
            
            await executeQuery(`
                ALTER TABLE users 
                ADD nickname NVARCHAR(100)
            `);
            
            console.log('✅ nickname column added successfully');
        } else {
            console.log('nickname column already exists');
        }
        
    } catch (error) {
        console.error('Error adding columns:', error);
    }
}

addUpdatedAtColumn();