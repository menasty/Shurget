const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req, res) => {
  res.send('<h1>Shurget - On Demand Pickup Trucks</h1><p>App is live.</p>');
});

app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// Admin routes
app.use('/admin', require('./routes/admin'));

app.listen(port, () => {
  console.log(`✅ Shurget server running on port ${port}`);
});
