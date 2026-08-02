const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool Setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
app.listen(port, () => {
    console.log(`🚀 সার্ভার রানিং: http://localhost:${port}`);
});
// Test DB Connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Successfully connected to PostgreSQL database!');
  release();
});

// 1. নতুন সদস্য যোগ করার API (POST)
app.post('/api/members', async (req, res) => {
  try {
    const { name, phone, nid, address } = req.body;
    const newMember = await pool.query(
      'INSERT INTO members (name, phone, nid, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone, nid, address]
    );
    res.json({ success: true, member: newMember.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});
// লগইন এপিআই
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ success: true, message: 'লগইন সফল হয়েছে!', role: user.role });
        } else {
            res.status(401).json({ success: false, message: 'ভুল ইউজারনেম অথবা পাসওয়ার্ড!' });
        }
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: 'সার্ভারে সমস্যা হয়েছে!' });
    }
});
// 2. সব সদস্যের তালিকা পাওয়ার API (GET)
app.get('/api/members', async (req, res) => {
  try {
    const allMembers = await pool.query('SELECT * FROM members ORDER BY id DESC');
    res.json(allMembers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// Root Route
app.get('/', (req, res) => {
  res.send('Samity App Backend Server is running!');
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// আজকের তারিখ (YYYY-MM-DD) পাওয়ার হেল্পার
const getTodayDate = () => new Date().toISOString().split('T')[0];

// ---- ১. সঞ্চয় উত্তোলন (Savings Withdrawals) API ----
app.get('/api/savings-withdrawals', (req, res) => {
    const today = getTodayDate();
    db.all("SELECT * FROM savings_withdrawals WHERE date = ?", [today], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/savings-withdrawals', (req, res) => {
    const { id, member, amount, note, time } = req.body;
    const date = getTodayDate();
    const sql = `INSERT INTO savings_withdrawals (id, member, amount, note, time, date) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [id, member, amount, note, time, date], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id });
    });
});

// ---- ২. লোন বিতরণ (Loan Disbursements) API ----
app.get('/api/loan-disbursements', (req, res) => {
    const today = getTodayDate();
    db.all("SELECT * FROM loan_disbursements WHERE date = ?", [today], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/loan-disbursements', (req, res) => {
    const { id, member, scheme, amount, installments, note, time } = req.body;
    const date = getTodayDate();
    const sql = `INSERT INTO loan_disbursements (id, member, scheme, amount, installments, note, time, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [id, member, scheme, amount, installments, note, time, date], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id });
    });
});

// ---- ৩. দৈনিক খরচ (Daily Expenses) API ----
app.get('/api/daily-expenses', (req, res) => {
    const today = getTodayDate();
    db.all("SELECT * FROM daily_expenses WHERE date = ?", [today], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/daily-expenses', (req, res) => {
    const { id, category, title, amount, time } = req.body;
    const date = getTodayDate();
    const sql = `INSERT INTO daily_expenses (id, category, title, amount, time, date) VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(sql, [id, category, title, amount, time, date], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id });
    });
});


// লগইন এপিআই
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // নিরাপত্তার জন্য ডেটাবেজ থেকে ইউজার যাচাই
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'ডাটাবেজ সমস্যা হয়েছে!' });
        }
        if (row) {
            res.json({ success: true, message: 'লগইন সফল হয়েছে!', role: row.role });
        } else {
            res.status(401).json({ success: false, message: 'ভুল ইউজারনেম অথবা পাসওয়ার্ড!' });
        }
    });
});