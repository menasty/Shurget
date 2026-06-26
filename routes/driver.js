const express = require('express');
const router = express.Router();
const { getDriverByEmail } = require('../db/drivers');
const { getAvailableJobs, acceptJob, declineJob, getMyJobs } = require('../db/orders');

// Simple driver auth middleware
async function requireDriver(req, res, next) {
  const email = req.query.email || req.body.email;
  if (!email) {
    return res.status(401).send('Driver email required. Use ?email=...');
  }
  const driver = await getDriverByEmail(email);
  if (!driver) {
    return res.status(401).send('Driver not found or not approved.');
  }
  req.driver = driver;
  next();
}

router.use(requireDriver);

// Available jobs for drivers
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await getAvailableJobs();
    res.render('driver-jobs', { 
      jobs, 
      driver: req.driver 
    });
  } catch (e) {
    res.render('driver-jobs', { jobs: [], driver: req.driver });
  }
});

// My accepted jobs
router.get('/my-jobs', async (req, res) => {
  try {
    const jobs = await getMyJobs(req.driver.id);
    res.render('driver-my-jobs', { 
      jobs, 
      driver: req.driver 
    });
  } catch (e) {
    res.render('driver-my-jobs', { jobs: [], driver: req.driver });
  }
});

// Accept a job
router.post('/jobs/:id/accept', async (req, res) => {
  try {
    const order = await acceptJob(req.params.id, req.driver.id, req.driver.name, req.driver.phone);
    if (order) {
      res.json({ success: true });
    } else {
      res.status(409).json({ error: 'Job no longer available' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept job' });
  }
});

// Decline a job
router.post('/jobs/:id/decline', async (req, res) => {
  try {
    await declineJob(req.params.id, req.driver.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to decline job' });
  }
});

module.exports = router;
