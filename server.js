const express = require('express');
const path = require('path');
const { pool } = require('./db/index');
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

app.get('/health/schema', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT to_regclass('public.orders') AS orders_table, to_regclass('public.driver_applications') AS drivers_table`
    );
    const row = result.rows[0] || {};
    const ordersReady = row.orders_table === 'orders';
    const driversReady = row.drivers_table === 'driver_applications';
    const healthy = ordersReady && driversReady;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'degraded',
      schema: {
        orders: ordersReady,
        driver_applications: driversReady
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      schema: {
        orders: false,
        driver_applications: false
      },
      error: error.message
    });
  }
});

// Routes
app.use('/admin', require('./routes/admin'));
app.use('/book', require('./routes/booking'));

app.listen(port, () => {
  console.log(`✅ Shurget server running on port ${port}`);

  // Log schema readiness on boot so deploy logs surface missing table issues quickly.
  pool
    .query(`SELECT to_regclass('public.orders') AS orders_table`)
    .then(({ rows }) => {
      const isReady = rows[0] && rows[0].orders_table === 'orders';
      if (isReady) {
        console.log('✅ Schema check: orders table exists');
      } else {
        console.error('❌ Schema check: orders table missing');
      }
    })
    .catch((error) => {
      console.error('❌ Schema check failed:', error.message);
    });
});
