const { pool } = require('./db/index');

async function migrate() {
  console.log('🚀 Running database migrations...');
  const client = await pool.connect();
  try {
    // Driver applications
    await client.query(`
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

    // Orders table
    await client.query(`
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

    console.log('✅ All tables ready');
  } catch (err) {
    console.error('Migration error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
