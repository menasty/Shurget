// routes/test-email.js — DEV/STAGING ONLY
// Sends a single test email to a specified address to verify Postmark connectivity.
// Mount at /api/test-email. Remove or gate behind admin auth before production if desired.

const express = require('express');
const router  = express.Router();

/**
 * POST /api/test-email
 * Body: { "to": "you@example.com" }
 *
 * Sends a test confirmation-style email using the live Postmark config.
 * Returns JSON indicating success or failure with Postmark's response detail.
 */
router.post('/', async (req, res) => {
  const token    = process.env.POSTMARK_SERVER_TOKEN;
  const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'hello@shurgetapp.com';
  const to       = req.body?.to;

  if (!token) {
    return res.status(500).json({
      ok: false,
      error: 'POSTMARK_SERVER_TOKEN is not set in environment variables.',
    });
  }

  if (!to || !to.includes('@')) {
    return res.status(400).json({
      ok: false,
      error: 'Provide a valid "to" email address in the request body.',
    });
  }

  const fakeOrder = {
    id:            'TEST-001',
    customerName:  'Test Customer',
    itemType:      'furniture',
    pickupAddress: '123 Pickup St, Castle Rock, CO',
    dropoffAddress:'456 Dropoff Ave, Denver, CO',
    distanceMiles: 18.4,
    priceTotal:    148.35,
    etaMinutes:    30,
    driverName:    'Test Driver',
    driverPhone:   '(720) 555-0100',
  };

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px;">
      <h2 style="color:#1a1a1a;">✅ Postmark Test — Shurget Email Connected</h2>
      <p>This is a test email confirming your Postmark integration is working correctly.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
      <h3 style="color:#333;">Sample Order Confirmation</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#666;">Order #</td><td style="padding:6px 0;font-weight:bold;">${fakeOrder.id}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Item</td><td style="padding:6px 0;">${fakeOrder.itemType}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Pickup</td><td style="padding:6px 0;">${fakeOrder.pickupAddress}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Dropoff</td><td style="padding:6px 0;">${fakeOrder.dropoffAddress}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Distance</td><td style="padding:6px 0;">${fakeOrder.distanceMiles} miles</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Driver</td><td style="padding:6px 0;">${fakeOrder.driverName} · ${fakeOrder.driverPhone}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">ETA</td><td style="padding:6px 0;">${fakeOrder.etaMinutes} minutes</td></tr>
        <tr><td style="padding:6px 0;color:#666;font-size:16px;"><strong>Total</strong></td><td style="padding:6px 0;font-size:16px;font-weight:bold;color:#2563eb;">$${fakeOrder.priceTotal}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
      <p style="color:#999;font-size:12px;">Sent from: ${fromEmail} · Shurget test route /api/test-email</p>
    </div>
  `;

  const text = `
Postmark Test — Shurget Email Connected

This is a test email confirming your Postmark integration is working.

Sample Order #${fakeOrder.id}
Item: ${fakeOrder.itemType}
Pickup: ${fakeOrder.pickupAddress}
Dropoff: ${fakeOrder.dropoffAddress}
Distance: ${fakeOrder.distanceMiles} miles
Driver: ${fakeOrder.driverName} · ${fakeOrder.driverPhone}
ETA: ${fakeOrder.etaMinutes} minutes
Total: $${fakeOrder.priceTotal}

Sent from: ${fromEmail}
  `.trim();

  try {
    const pmRes = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept':                    'application/json',
        'Content-Type':              'application/json',
        'X-Postmark-Server-Token':   token,
      },
      body: JSON.stringify({
        From:          fromEmail,
        To:            to,
        Subject:       '[Shurget Test] Postmark connectivity check',
        HtmlBody:      html,
        TextBody:      text,
        MessageStream: 'outbound',
      }),
    });

    const data = await pmRes.json();

    if (!pmRes.ok) {
      console.error('[test-email] Postmark rejected the request:', data);
      return res.status(502).json({
        ok:      false,
        error:   'Postmark rejected the request.',
        detail:  data,
        from:    fromEmail,
        to,
      });
    }

    console.log(`[test-email] Test email sent to ${to} — MessageID: ${data.MessageID}`);
    return res.json({
      ok:        true,
      message:   `Test email sent to ${to}`,
      messageId: data.MessageID,
      from:      fromEmail,
      to,
    });

  } catch (err) {
    console.error('[test-email] Unexpected error:', err.message);
    return res.status(500).json({
      ok:    false,
      error: err.message,
    });
  }
});

module.exports = router;
