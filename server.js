const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// PostgreSQL Connection Pool Setup
const pool = new Pool(
    process.env.NODE_ENV === 'production' || process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false }
          }
        : {
              user: process.env.DB_USER,
              host: process.env.DB_HOST,
              database: process.env.DB_DATABASE,
              password: process.env.DB_PASSWORD,
              port: process.env.DB_PORT,
              ssl: false
          }
);

// Test DB Connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Successfully connected to PostgreSQL database!');
  release();
});

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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

// 2. সব সদস্যের তালিকা পাওয়ার API (GET)
app.get('/api/members', async (req, res) => {
  try {
    const allMembers = await pool.query('SELECT * FROM members ORDER BY id DESC');
    res.json(allMembers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// ৩. মোট সদস্যের সংখ্যা পাওয়ার জন্য এপিআই রাউট
app.get('/api/total-members', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM members');
        const totalMembers = parseInt(result.rows[0].count) || 0;
        res.json({ success: true, totalMembers: totalMembers });
    } catch (err) {
        console.error('Error fetching total members:', err.message);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// ৪. লগইন এপিআই
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ success: true, message: 'লগইন সফল হয়েছে!', role: user.role });
        } else {
            res.status(401).json({ success: false, message: 'ভুল ইউজারনেম অথবা পাসওয়ার্ড!' });
        }
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: 'সার্ভারে সমস্যা হয়েছে!' });
    }
});

// আজকের তারিখ (YYYY-MM-DD) পাওয়ার হেল্পার
const getTodayDate = () => new Date().toISOString().split('T')[0];

// ---- ৫. সঞ্চয় উত্তোলন (Savings Withdrawals) API ----
app.get('/api/savings-withdrawals', async (req, res) => {
    try {
        const today = getTodayDate();
        const result = await pool.query('SELECT * FROM savings_withdrawals WHERE date = $1', [today]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/savings-withdrawals', async (req, res) => {
    try {
        const { id, member, amount, note, time } = req.body;
        const date = getTodayDate();
        const query = `INSERT INTO savings_withdrawals (id, member, amount, note, time, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
        await pool.query(query, [id, member, amount, note, time, date]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- ৬. লোন বিতরণ (Loan Disbursements) API ----
app.get('/api/loan-disbursements', async (req, res) => {
    try {
        const today = getTodayDate();
        const result = await pool.query('SELECT * FROM loan_disbursements WHERE date = $1', [today]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/loan-disbursements', async (req, res) => {
    try {
        const { id, member, scheme, amount, installments, note, time } = req.body;
        const date = getTodayDate();
        const query = `INSERT INTO loan_disbursements (id, member, scheme, amount, installments, note, time, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
        await pool.query(query, [id, member, scheme, amount, installments, note, time, date]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- ৭. দৈনিক খরচ (Daily Expenses) API ----
app.get('/api/daily-expenses', async (req, res) => {
    try {
        const today = getTodayDate();
        const result = await pool.query('SELECT * FROM daily_expenses WHERE date = $1', [today]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/daily-expenses', async (req, res) => {
    try {
        const { id, category, title, amount, time } = req.body;
    const date = getTodayDate();
        const query = `INSERT INTO daily_expenses (id, category, title, amount, time, date) VALUES ($1, $2, $3, $4, $5, $6)`;
        await pool.query(query, [id, category, title, amount, time, date]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server (Only once)
app.listen(port, () => {
    console.log(`🚀 সার্ভার রানিং: http://localhost:${port}`);
});