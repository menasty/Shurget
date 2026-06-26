const express = require('express');
const router = express.Router();
const { pool } = require('../db/index');

const DEFAULT_ADMIN_EMAIL = 'admin@shurget.com';

function getAdminEmail(req) {
  return req.query.admin || req.adminEmail || DEFAULT_ADMIN_EMAIL;
}

function getSafeBookingFilters(query) {
  const allowedStatus = new Set([
    'all',
    'pending',
    'paid',
    'assigned',
    'in_progress',
    'delivered',
    'cancelled',
    'pending_payment'
  ]);
  const allowedSort = new Set(['created_at', 'price_total', 'status']);

  const status = allowedStatus.has(query.status) ? query.status : 'all';
  const sort = allowedSort.has(query.sort) ? query.sort : 'created_at';
  const dir = query.dir === 'asc' ? 'asc' : 'desc';

  return { status, sort, dir };
}

const defaultMetricsViewModel = {
  metrics: {
    totals: {
      total_orders: 0,
      completed: 0,
      cancelled: 0,
      avg_order_value: 0,
      total_revenue: 0
    },
    week: { cnt: 0, revenue: 0 },
    month: { cnt: 0, revenue: 0 }
  },
  byStatus: [],
  byTier: [],
  daily: [],
  topRoutes: [],
  reviewEmailStats: { cnt: 0 },
  ratingStats: { cnt: 0, avg_rating: 0 }
};

router.get('/', (req, res) => {
  res.render('admin-index', { adminEmail: getAdminEmail(req) });
});

// Drivers
router.get('/drivers', async (req, res) => {
  const adminEmail = getAdminEmail(req);
  try {
    const result = await pool.query('SELECT * FROM driver_applications ORDER BY created_at DESC');
    res.render('admin-drivers', { 
      drivers: result.rows || [],
      adminEmail
    });
  } catch (e) {
    res.render('admin-drivers', { drivers: [], adminEmail });
  }
});

// Bookings
router.get('/bookings', async (req, res) => {
  const adminEmail = getAdminEmail(req);
  const filters = getSafeBookingFilters(req.query || {});
  const flash = req.query.flash || null;

  const where = [];
  const params = [];
  if (filters.status !== 'all') {
    params.push(filters.status);
    where.push(`status = $${params.length}`);
  }

  const query = `
    SELECT *
    FROM orders
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${filters.sort} ${filters.dir.toUpperCase()}
  `;

  try {
    const [ordersResult, driversResult] = await Promise.all([
      pool.query(query, params),
      pool.query('SELECT id, name, phone, city, vehicle_type FROM driver_applications WHERE status = $1 ORDER BY name ASC', ['active'])
    ]);

    const orders = ordersResult.rows || [];
    const drivers = driversResult.rows || [];

    res.render('admin-bookings', { 
      orders,
      drivers,
      filters,
      total: orders.length,
      flash,
      adminEmail
    });
  } catch (e) {
    res.render('admin-bookings', {
      orders: [],
      drivers: [],
      filters,
      total: 0,
      flash,
      adminEmail
    });
  }
});

// Dispatch
router.get('/dispatch', async (req, res) => {
  const adminEmail = getAdminEmail(req);
  try {
    const [driversResult, pendingResult, activeResult, recentResult] = await Promise.all([
      pool.query('SELECT * FROM driver_applications WHERE status = $1 ORDER BY created_at DESC', ['active']),
      pool.query("SELECT * FROM orders WHERE status IN ('pending', 'paid', 'pending_payment') ORDER BY created_at DESC"),
      pool.query("SELECT * FROM orders WHERE status IN ('assigned', 'in_progress') ORDER BY created_at DESC"),
      pool.query("SELECT * FROM orders WHERE status IN ('delivered', 'cancelled') ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 20")
    ]);

    res.render('admin-dispatch', { 
      drivers: driversResult.rows || [],
      pending: pendingResult.rows || [],
      active: activeResult.rows || [],
      recent: recentResult.rows || [],
      assigned: req.query.assigned === '1',
      delivered: req.query.delivered === '1',
      cancelled: req.query.cancelled === '1',
      error: req.query.error || null,
      adminEmail
    });
  } catch (e) {
    res.render('admin-dispatch', {
      drivers: [],
      pending: [],
      active: [],
      recent: [],
      assigned: false,
      delivered: false,
      cancelled: false,
      error: null,
      adminEmail
    });
  }
});

// Metrics
router.get('/metrics', async (req, res) => {
  const adminEmail = getAdminEmail(req);

  try {
    const [totalsResult, weekResult, monthResult, byStatusResult, byTierResult, dailyResult, topRoutesResult, reviewEmailResult, ratingResult] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_orders,
          COUNT(*) FILTER (WHERE status = 'delivered')::int AS completed,
          COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
          COALESCE(AVG(price_total), 0)::float AS avg_order_value,
          COALESCE(SUM(price_fee), 0)::float AS total_revenue
        FROM orders
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS cnt,
          COALESCE(SUM(price_fee), 0)::float AS revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS cnt,
          COALESCE(SUM(price_fee), 0)::float AS revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `),
      pool.query(`
        SELECT status, COUNT(*)::int AS cnt
        FROM orders
        GROUP BY status
      `),
      pool.query(`
        SELECT
          CASE
            WHEN COALESCE(price_base, 0) < 50 THEN 'small'
            WHEN COALESCE(price_base, 0) < 70 THEN 'medium'
            ELSE 'large'
          END AS tier,
          COUNT(*)::int AS cnt
        FROM orders
        GROUP BY tier
      `),
      pool.query(`
        SELECT DATE(created_at) AS date, COUNT(*)::int AS orders
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `),
      pool.query(`
        SELECT
          SPLIT_PART(COALESCE(pickup_address, ''), ',', 2) AS pickup_city,
          SPLIT_PART(COALESCE(dropoff_address, ''), ',', 2) AS dropoff_city,
          COUNT(*)::int AS cnt,
          COALESCE(SUM(price_fee), 0)::float AS total_revenue
        FROM orders
        GROUP BY pickup_city, dropoff_city
        ORDER BY cnt DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT COUNT(*)::int AS cnt
        FROM orders
        WHERE review_email_sent_at IS NOT NULL
      `),
      pool.query(`
        SELECT COUNT(*)::int AS cnt, COALESCE(AVG(rating), 0)::float AS avg_rating
        FROM driver_ratings
        WHERE source = 'email'
      `)
    ]);

    const viewModel = {
      metrics: {
        totals: totalsResult.rows[0] || defaultMetricsViewModel.metrics.totals,
        week: weekResult.rows[0] || defaultMetricsViewModel.metrics.week,
        month: monthResult.rows[0] || defaultMetricsViewModel.metrics.month
      },
      byStatus: byStatusResult.rows || [],
      byTier: byTierResult.rows || [],
      daily: dailyResult.rows || [],
      topRoutes: (topRoutesResult.rows || []).map((route) => ({
        ...route,
        pickup_city: (route.pickup_city || '').trim() || 'Unknown',
        dropoff_city: (route.dropoff_city || '').trim() || 'Unknown'
      })),
      reviewEmailStats: reviewEmailResult.rows[0] || defaultMetricsViewModel.reviewEmailStats,
      ratingStats: ratingResult.rows[0] || defaultMetricsViewModel.ratingStats,
      adminEmail
    };

    res.render('admin-metrics', viewModel);
  } catch (e) {
    res.render('admin-metrics', {
      ...defaultMetricsViewModel,
      adminEmail
    });
  }
});

// Ratings
router.get('/ratings', (req, res) => {
  res.render('admin-ratings', { adminEmail: getAdminEmail(req) });
});

module.exports = router;
