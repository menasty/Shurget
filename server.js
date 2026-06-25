const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('layout', { title: 'Shurget - Pickup Truck Delivery' });
});

app.get('/health', (req, res) => res.json({ status: 'healthy' }));

app.get('/book', (req, res) => {
  res.send('<h1>Book a Haul</h1><p>Booking form coming soon.</p>');
});

app.get('/admin', (req, res) => {
  res.send('<h1>Admin Panel</h1><p>Driver management coming soon.</p>');
});

app.listen(port, () => {
  console.log(`✅ Shurget server running on port ${port}`);
});
