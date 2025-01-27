const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
    try {
        // Get all migration files
        const migrationsDir = path.join(__dirname, '..', 'migrations');
        const files = await fs.readdir(migrationsDir);
        
        // Sort files to ensure they run in order
        const migrationFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort();

        // Run each migration
        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, 'utf8');
            
            await pool.query(sql);
            console.log(`Completed migration: ${file}`);
        }

        console.log('All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    }
}

runMigrations(); 