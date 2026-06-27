const express = require('express');
const router = express.Router();
const { pool } = require('../db/index');
const { sendDriverApplicationConfirmation } = require('../services/email');

router.get('/', (req, res) => {
  res.render('drive', { application: null });
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, vehicleType, city } = req.body;

    if (!name || !email || !phone || !vehicleType || !city) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await pool.query(`
      INSERT INTO driver_applications (name, email, phone, vehicle_type, city, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING id
    `, [name, email, phone, vehicleType, city]);

    const application = result.rows[0];

    // Send confirmation email
    sendDriverApplicationConfirmation({
      name,
      email,
      applicationId: application.id
    }).catch(err => console.error('Email failed:', err));

    // Show success page
    res.send(`
      <div style="max-width: 600px; margin: 80px auto; padding: 40px; text-align: center; font-family: system-ui;">
        <h1 style="color: #ea580c;">✅ Application Submitted!</h1>
        <p>Thank you, ${name}.</p>
        <p>Your driver application has been received and is under review.</p>
        <p>A confirmation email has been sent to <strong>${email}</strong>.</p>
        <p>We will contact you shortly with next steps.</p>
        <p><a href="/drive">Submit Another Application</a> | <a href="/">← Back to Home</a></p>
      </div>
    `);
  } catch (err) {
    console.error('Driver apply error:', err);
    res.status(500).send('Error submitting application. Please try again.');
  }
});

module.exports = router;
