const express = require('express');
const router = express.Router();
const { pool } = require('../db/index');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

router.get('/', (req, res) => {
  res.render('booking');
});

router.post('/', async (req, res) => {
  try {
    const { itemType, pickupAddress, dropoffAddress, helpers = '0' } = req.body;
    
    const helperCount = parseInt(helpers) || 0;
    const basePrice = 89;
    const helperPrice = helperCount * 25;
    const total = basePrice + helperPrice;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${itemType} Delivery via Shurget` },
          unit_amount: total * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `https://shurget-v1-1.onrender.com/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://shurget-v1-1.onrender.com/book`,
    });

    res.redirect(session.url);
  } catch (err) {
    console.error(err);
    res.send('Payment session error. Try again or contact support.');
  }
});

module.exports = router;
