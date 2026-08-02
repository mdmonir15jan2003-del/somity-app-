const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const createTables = async () => {
    const queryText = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        );

        INSERT INTO users (username, password, role) 
        VALUES ('admin', '123456', 'admin')
        ON CONFLICT (username) DO NOTHING;
    `;

    try {
        await pool.query(queryText);
        console.log('Tables and default admin user created successfully!');
    } catch (err) {
        console.error('Error creating tables:', err.stack);
    } finally {
        await pool.end();
    }
};

createTables();