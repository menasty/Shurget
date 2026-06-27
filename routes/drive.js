const express = require('express');
const router = express.Router();
const { pool } = require('../db/index');

router.get('/', (req, res) => {
  res.render('drive', { application: null });
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, vehicleType, city } = req.body;

    if (!name || !email || !phone || !vehicleType || !city) {
      return res.status(400).send('<h2 style="color:red">Please fill out all required fields.</h2>');
    }

    await pool.query(`
      INSERT INTO driver_applications (name, email, phone, vehicle_type, city, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
    `, [name, email, phone, vehicleType, city]);

    res.send(`
      <div style="max-width: 600px; margin: 80px auto; padding: 40px; text-align: center; font-family: system-ui;">
        <h1 style="color: #ea580c;">✅ Application Submitted Successfully!</h1>
        <p>Thank you, ${name}.</p>
        <p>Your driver application has been received and is under review.</p>
        <p>We will contact you shortly with next steps.</p>
        <p><a href="/drive">Submit Another Application</a> | <a href="/">← Back to Home</a></p>
      </div>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('<h2 style="color:red">Error submitting application. Please try again.</h2>');
  }
});

module.exports = router;
