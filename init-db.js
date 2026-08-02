const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const createTables = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      nid VARCHAR(30),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(queryText);
    console.log(' Members table created successfully!');
  } catch (err) {
    console.error('Error creating table:', err.stack);
  } finally {
    await pool.end();
  }
};

createTables();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./somity.db');

db.serialize(() => {
    // ১. লোন বিতরণ টেবিল
    db.run(`CREATE TABLE IF NOT EXISTS loan_disbursements (
        id TEXT PRIMARY KEY,
        member TEXT NOT NULL,
        scheme TEXT,
        amount REAL NOT NULL,
        installments INTEGER,
        note TEXT,
        time TEXT,
        date TEXT
    )`);

    // ২. দৈনিক খরচ টেবিল
    db.run(`CREATE TABLE IF NOT EXISTS daily_expenses (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        time TEXT,
        date TEXT
    )`);

    // ৩. সঞ্চয় উত্তোলন টেবিল
    db.run(`CREATE TABLE IF NOT EXISTS savings_withdrawals (
        id TEXT PRIMARY KEY,
        member TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        time TEXT,
        date TEXT
    )`);

    console.log("✅ ডাটাবেজ টেবিল সফলভাবে তৈরি হয়েছে!");
});

db.close();