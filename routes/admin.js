const express = require('express');
const router = express.Router();
const { pool } = require('../db/index');

router.get('/', (req, res) => {
  res.render('admin-index');
});

// Drivers
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
    res.render('admin-bookings', { 
      orders: result.rows || [],
      flash: null 
    });
  } catch (e) {
    res.render('admin-bookings', { orders: [], flash: null });
  }
});

// Dispatch
router.get('/dispatch', async (req, res) => {
  try {
    const drivers = await pool.query('SELECT * FROM driver_applications WHERE status = $1', ['active']);
    res.render('admin-dispatch', { 
      drivers: drivers.rows || [],
      pending: [],
      active: []
    });
  } catch (e) {
    res.render('admin-dispatch', { drivers: [], pending: [], active: [] });
  }
});

// Metrics
router.get('/metrics', (req, res) => {
  res.render('admin-metrics', { 
    metrics: { totals: { total_orders: 0, completed: 0, cancelled: 0 } },
    byStatus: [],
    daily: []
  });
});

// Ratings
router.get('/ratings', (req, res) => {
  res.render('admin-ratings');
});

module.exports = router;
