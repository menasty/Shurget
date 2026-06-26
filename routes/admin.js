const express = require('express');
const router = express.Router();
const { pool } = require('../db/index');

router.get('/', (req, res) => {
  res.render('admin-index');
});

// Drivers - already working
router.get('/drivers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM driver_applications ORDER BY created_at DESC');
    res.render('admin-drivers', { drivers: result.rows || [] });
  } catch (e) {
    res.render('admin-drivers', { drivers: [] });
  }
});

// Bookings
router.get('/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.render('admin-bookings', { orders: result.rows || [] });
  } catch (e) {
    res.render('admin-bookings', { orders: [] });
  }
});

// Dispatch
router.get('/dispatch', (req, res) => {
  res.render('admin-dispatch', { pending: [], active: [] });
});

// Metrics
router.get('/metrics', (req, res) => {
  res.render('admin-metrics', { metrics: {}, byStatus: [], daily: [] });
});

// Ratings
router.get('/ratings', (req, res) => {
  res.render('admin-ratings');
});

module.exports = router;
