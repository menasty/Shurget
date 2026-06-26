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

async function ensureCoreSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS driver_applications (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      vehicle_type TEXT,
      city TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      item_type TEXT,
      pickup_address TEXT,
      dropoff_address TEXT,
      helpers INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      driver_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Routes
app.use('/admin', require('./routes/admin'));
app.use('/book', require('./routes/booking'));

async function startServer() {
  try {
    await ensureCoreSchema();
    console.log('✅ Core schema ready');

    app.listen(port, () => {
      console.log(`✅ Shurget server running on port ${port}`);
    });
  } catch (error) {
    console.error('❌ Startup schema initialization failed:', error.message);
    process.exit(1);
  }
}

startServer();
