const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send(`
    <h1>✅ Shurget Admin Panel</h1>
    <p>Database connected successfully.</p>
    <p><a href="/admin/drivers">Manage Drivers</a></p>
  `);
});

module.exports = router;
