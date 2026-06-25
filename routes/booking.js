const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('booking');
});

router.post('/', (req, res) => {
  console.log('Booking submitted:', req.body);
  
  const { itemType, pickupAddress, dropoffAddress, helpers } = req.body;
  
  res.send(`
    <h1 style="color:#ea580c">Booking Received!</h1>
    <p>Thank you. We received your request for a <strong>${itemType}</strong> from <strong>${pickupAddress}</strong> to <strong>${dropoffAddress}</strong>.</p>
    <p>A Shurget driver will be matched shortly. You'll receive a confirmation email with details and pricing.</p>
    <p><a href="/book">Book Another Haul</a> | <a href="/">← Back to Home</a></p>
  `);
});

module.exports = router;
