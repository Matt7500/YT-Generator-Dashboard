require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initializeDatabase() {
    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: 'postgres', // Connect to default database first
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'yt_generator';
        const result = await pool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );

        if (result.rows.length === 0) {
            console.log(`Creating database: ${dbName}`);
            await pool.query(`CREATE DATABASE ${dbName}`);
        }

        // Close connection to postgres database
        await pool.end();

        // Connect to our new database
        const appPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: dbName,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 5432,
        });

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Creating tables and indexes...');
        await appPool.query(schema);
        
        console.log('Database initialization completed successfully!');
        await appPool.end();
        
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase(); 