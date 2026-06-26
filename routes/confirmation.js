const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const sessionId = req.query.session_id || 'N/A';
  
  res.render('confirmation', { 
    sessionId: sessionId,
    title: 'Payment Successful - Shurget'
  });
});

module.exports = router;
