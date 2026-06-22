const express = require('express');
const router = express.Router();
const { pool } = require('../db/index');

// GET /admin
router.get('/', (req, res) => {
  res.send(`
    <h1>✅ Shurget Admin Panel</h1>
    <p><a href="/admin/drivers">→ Manage Drivers</a></p>
  `);
});

// GET /admin/drivers
router.get('/drivers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM driver_applications ORDER BY created_at DESC');
    const drivers = result.rows;

    let html = `<h1>Drivers (${drivers.length})</h1><table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">`;
    html += `<tr><th>Name</th><th>Email</th><th>Phone</th><th>Vehicle</th><th>City</th><th>Status</th><th>Action</th></tr>`;

    drivers.forEach(driver => {
      html += `
        <tr>
          <td>${driver.name}</td>
          <td>${driver.email}</td>
          <td>${driver.phone || '-'}</td>
          <td>${driver.vehicle_type || '-'}</td>
          <td>${driver.city || '-'}</td>
          <td>${driver.status}</td>
          <td>
            ${driver.status === 'pending' ? 
              `<a href="/admin/drivers/${driver.id}/activate" style="color:green;font-weight:bold;">Approve</a>` : 
              '✅ Active'}
          </td>
        </tr>`;
    });

    html += `</table>`;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error: ' + err.message);
  }
});

// Activate driver
router.get('/drivers/:id/activate', async (req, res) => {
  try {
    await pool.query("UPDATE driver_applications SET status = 'active', updated_at = NOW() WHERE id = $1", [req.params.id]);
    res.redirect('/admin/drivers');
  } catch (err) {
    res.status(500).send('Error activating driver');
  }
});

module.exports = router;
