const express = require('express');
const router = express.Router();
const { pool } = require('../db/index');

router.get('/', (req, res) => {
  res.send(`
    <h1>Shurget Admin Panel</h1>
    <p><a href="/admin/drivers">Drivers</a> | <a href="/admin/bookings">Bookings</a> | <a href="/admin/dispatch">Dispatch</a></p>
  `);
});

router.get('/drivers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM driver_applications ORDER BY created_at DESC');
    res.send(`<h1>Drivers</h1><pre>${JSON.stringify(result.rows, null, 2)}</pre>`);
  } catch (e) {
    res.send('Driver list error');
  }
});

router.get('/bookings', async (req, res) => {
  res.send('<h1>Bookings</h1><p>Bookings list coming soon.</p>');
});

router.get('/dispatch', async (req, res) => {
  res.send('<h1>Dispatch</h1><p>Dispatch board coming soon.</p>');
});

module.exports = router;
