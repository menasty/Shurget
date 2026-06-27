const express = require('express');
const router = express.Router();
const multer = require('multer');
const { pool } = require('../db/index');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
});

// GET /drive — onboarding form
router.get('/', (req, res) => {
  res.render('drive', { application: null });
});

// POST /drive — handle form + document uploads
router.post('/', upload.fields([
  { name: 'vehicleInsuranceDoc', maxCount: 1 },
  { name: 'driverLicenseDoc', maxCount: 1 },
  { name: 'vehicleRegistrationDoc', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, email, phone, vehicleType, city } = req.body;

    if (!name || !email || !phone || !vehicleType || !city) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(`
      INSERT INTO driver_applications 
      (name, email, phone, vehicle_type, city, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING id
    `, [name, email, phone, vehicleType, city]);

    res.json({ 
      success: true, 
      message: 'Application submitted successfully!',
      id: result.rows[0].id 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

module.exports = router;
