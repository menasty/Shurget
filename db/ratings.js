// db/ratings.js — Driver rating CRUD
// Owns: driver_ratings table reads/writes, rating token idempotency
// Does NOT own: token generation (services/rating-token.js), email sending

const db = require('./index');

/**
 * Submit a driver rating. One rating per order (unique index enforces idempotency).
 * Returns the created row, or null if already rated (ON CONFLICT DO NOTHING).
 */
async function createRating({ orderId, driverId, rating, comment, source, tokenUsed }) {
  const { rows } = await db.query(
    `INSERT INTO driver_ratings (order_id, driver_id, rating, comment, source, token_used)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (order_id) DO NOTHING
     RETURNING *`,
    [orderId, driverId || null, rating, comment || null, source || 'email', tokenUsed || null]
  );
  return rows[0] || null;
}

/**
 * Check if an order already has a rating submitted.
 */
async function getRatingByOrderId(orderId) {
  const { rows } = await db.query(
    'SELECT * FROM driver_ratings WHERE order_id = $1 LIMIT 1',
    [orderId]
  );
  return rows[0] || null;
}

/**
 * Count of ratings submitted from email link (source='email').
 * Used for admin metrics tile.
 */
async function countEmailRatings() {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS cnt,
            COALESCE(AVG(rating), 0) AS avg_rating
     FROM driver_ratings
     WHERE source = 'email'`
  );
  return rows[0];
}

/**
 * Count of orders with review_email_sent_at set (emails sent).
 * Used for admin metrics tile.
 */
async function countReviewEmailsSent() {
  const { rows } = await db.query(
    'SELECT COUNT(*) AS cnt FROM orders WHERE review_email_sent_at IS NOT NULL'
  );
  return rows[0];
}

/**
 * Submit a dispute for an existing rating.
 * Idempotent: UNIQUE (order_id) on table prevents duplicates.
 */
async function createDispute({ orderId, driverId, rating, comment, reason }) {
  const { rows } = await db.query(
    `INSERT INTO driver_rating_disputes (order_id, driver_id, rating, comment, reason)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (order_id) DO NOTHING
     RETURNING *`,
    [orderId, driverId || null, rating || null, comment || null, reason]
  );
  return rows[0] || null;
}

/**
 * Get all disputes, optionally filtered by status.
 */
async function getDisputes({ status } = {}) {
  let sql = `
    SELECT d.*,
           o.item_type, o.pickup_address, o.dropoff_address, o.customer_name,
           o.customer_email, o.price_total,
           dr.name AS driver_name, dr.email AS driver_email
    FROM driver_rating_disputes d
    JOIN orders o ON o.id = d.order_id
    JOIN driver_applications dr ON dr.id = d.driver_id
  `;
  const params = [];
  if (status) {
    params.push(status);
    sql += ` WHERE d.status = $${params.length}`;
  }
  sql += ' ORDER BY d.created_at DESC';
  const { rows } = await db.query(sql, params);
  return rows;
}

/**
 * Get disputes for a specific driver.
 */
async function getDisputesByDriver(driverId) {
  const { rows } = await db.query(
    `SELECT d.*, o.item_type, o.pickup_address, o.dropoff_address, o.price_total
     FROM driver_rating_disputes d
     JOIN orders o ON o.id = d.order_id
     WHERE d.driver_id = $1
     ORDER BY d.created_at DESC`,
    [driverId]
  );
  return rows;
}

/**
 * Admin: resolve a dispute — override rating or dismiss.
 */
async function resolveDispute(disputeId, { status, adminNotes }) {
  const { rows } = await db.query(
    `UPDATE driver_rating_disputes
       SET status = $2, admin_notes = $3, resolved_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [disputeId, status, adminNotes || null]
  );
  return rows[0] || null;
}

module.exports = {
  createRating,
  getRatingByOrderId,
  countEmailRatings,
  countReviewEmailsSent,
  createDispute,
  getDisputes,
  getDisputesByDriver,
  resolveDispute,
};
