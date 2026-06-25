const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('booking');
});

// Handle form submission
router.post('/', (req, res) => {
  console.log('Booking submitted:', req.body);
  
  const { itemType, pickupAddress, dropoffAddress, helpers = '0' } = req.body;
  
  res.send(`
    <div style="max-width: 600px; margin: 40px auto; padding: 40px; text-align: center; font-family: system-ui; background: #f8f9fa; border-radius: 12px;">
      <h1 style="color: #ea580c;">✅ Booking Request Received!</h1>
      <p>Thank you! We received your request for a <strong>${itemType || 'item'}</strong>.</p>
      <p><strong>Pickup:</strong> ${pickupAddress}</p>
      <p><strong>Dropoff:</strong> ${dropoffAddress}</p>
      <p>A Shurget driver will be matched shortly. You'll receive a confirmation with pricing and details shortly.</p>
      <p><a href="/book" style="color:#ea580c; margin-right: 20px;">Book Another Haul</a> | <a href="/" style="color:#ea580c;">← Back to Home</a></p>
    </div>
  `);
});

module.exports = router;
