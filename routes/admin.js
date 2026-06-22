const express = require('express');
const router = express.Router();
const { pool } = require('../db/index');

// GET /admin
router.get('/', (req, res) => {
  res.send(`
    <h1>✅ Shurget Admin</h1>
    <p><a href="/admin/drivers">Manage Drivers</a></p>
  `);
});

// GET /admin/drivers
router.get('/drivers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM driver_applications ORDER BY created_at DESC');
    const drivers = result.rows;
    
    let html = `
      <h1>Shurget Drivers (${drivers.length})</h1>
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
        <tr><th>Name</th><th>Email</th><th>Phone</th><th>Vehicle</th><th>City</th><th>Status</th><th>Action</th></tr>
    `;

    drivers.forEach(d => {
      html += `
        <tr>
          <td>${d.name}</td>
          <td>${d.email}</td>
          <td>${d.phone || '-'}</td>
          <td>${d.vehicle_type || '-'}</td>
          <td>${d.city || '-'}</td>
          <td>${d.status}</td>
          <td>
            ${d.status === 'pending' ? 
              `<a href="/admin/drivers/${d.id}/activate" style="color:green;">Approve</a>` : 
              '✅ Active'}
          </td>
        </tr>`;
    });

    html += '</table>';
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

// Activate driver
router.get('/drivers/:id/activate', async (req, res) => {
  try {
    await pool.query("UPDATE driver_applications SET status = 'active' WHERE id = $1", [req.params.id]);
    res.redirect('/admin/drivers');
  } catch (err) {
    res.status(500).send('Error activating driver');
  }
});

module.exports = router;
