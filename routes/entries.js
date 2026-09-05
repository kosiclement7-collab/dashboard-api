const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireAuth = require('../middleware/auth');



// List all entries for the logged-in user, most recent first
router.get('/entries', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM entries WHERE user_id = $1 ORDER BY entry_date DESC, id DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load entries' });
  }
});

// Add a new entry (personal or business)
router.post('/entries', requireAuth, async (req, res) => {
  const { type, category, amount, entry_date, note } = req.body;
  if (!type || !category || amount === undefined) {
    return res.status(400).json({ error: 'type, category, and amount are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO entries (user_id, type, category, amount, entry_date, note)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6) RETURNING *`,
      [req.userId, type, category, amount, entry_date, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save entry' });
  }
});

// Dashboard summary — shaped to match the frontend's expected data object
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const entries = await pool.query(
      'SELECT * FROM entries WHERE user_id = $1 ORDER BY entry_date',
      [req.userId]
    );
    const rows = entries.rows;

    const personal = rows.filter(r => r.type === 'personal');
    const business = rows.filter(r => r.type === 'business');

    const balance = personal.reduce((sum, r) => sum + Number(r.amount), 0);
    const now = new Date();
    const monthlySpend = personal
      .filter(r => new Date(r.entry_date).getMonth() === now.getMonth() && Number(r.amount) < 0)
      .reduce((sum, r) => sum + Math.abs(Number(r.amount)), 0);

    const revenue = business.reduce((sum, r) => sum + Number(r.amount), 0);
    const orders = business.length;

    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = business.filter(r => {
        const rd = new Date(r.entry_date);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      }).length;
      trend.push(count);
    }

    res.json({
      balance,
      monthlySpend,
      savingsGoal: { current: balance, target: 500000 },
      revenue,
      orders,
      trend
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load dashboard' });
  }
});

// Delete an entry — only if it belongs to the logged-in user
router.delete('/entries/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete entry' });
  }
});

module.exports = router;
