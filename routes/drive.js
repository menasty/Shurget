const express = require('express');
const router = express.Router();
const { pool } = require('../db/index');

router.get('/', (req, res) => {
  res.render('drive', { 
    application: null,
    ga4Id: process.env.GA4_MEASUREMENT_ID || ''
  });
});

router.get('/earn', (req, res) => {
  res.render('drive-earn', { refCode: null, referrerName: null });
});

// POST /drive (form action)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, vehicleType, city } = req.body;

    if (!name || !email || !phone || !vehicleType || !city) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(`
      INSERT INTO driver_applications (name, email, phone, vehicle_type, city, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING id
    `, [name, email, phone, vehicleType, city]);

    res.json({ 
      success: true, 
      message: 'Application received!',
      application: { id: result.rows[0].id }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

module.exports = router;
