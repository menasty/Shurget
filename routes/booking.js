const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('booking');
});

router.post('/', (req, res) => {
  console.log('Booking submitted:', req.body);
  
  const { itemType, pickupAddress, dropoffAddress, helpers = '0' } = req.body;
  
  res.send(`
    <div style="max-width: 600px; margin: 40px auto; padding: 40px; text-align: center; font-family: system-ui;">
      <h1 style="color: #ea580c;">✅ Booking Request Received!</h1>
      <p>Thank you for your request.</p>
      <p><strong>Item:</strong> ${itemType || 'Not specified'}</p>
      <p><strong>Pickup:</strong> ${pickupAddress}</p>
      <p><strong>Dropoff:</strong> ${dropoffAddress}</p>
      <p>A Shurget driver will be matched shortly. We'll send you a confirmation with pricing and details.</p>
      <p><a href="/book" style="color:#ea580c;">Book Another Haul</a> | <a href="/" style="color:#ea580c;">← Back to Home</a></p>
    </div>
  `);
});

module.exports = router;
