// db/waitlist.js — Driver availability waitlist
// Owns: driver_waitlist table for "notify me when available" capture.

const db = require('./index');

/**
 * Add an email to the driver availability waitlist.
 * Idempotent: uses ON CONFLICT DO NOTHING (multiple submissions from same email/zip are fine).
 */
async function addToWaitlist({ email, pickupZip, dropoffZip, itemType }) {
  const sql = `
    INSERT INTO driver_waitlist (email, pickup_zip, dropoff_zip, item_type)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  const { rows } = await db.query(sql, [
    (email || '').toLowerCase().trim(),
    (pickupZip || '').trim(),
    dropoffZip || null,
    itemType || null,
  ]);
  return rows[0] || null;
}

/**
 * Get all waitlist entries for a given pickup zip code.
 * Used when a driver becomes available — find people to notify.
 */
async function getWaitlistByZip(pickupZip) {
  const { rows } = await db.query(
    `SELECT id, email, pickup_zip, dropoff_zip, item_type, created_at
     FROM driver_waitlist
     WHERE pickup_zip = $1 AND notified_at IS NULL
     ORDER BY created_at ASC`,
    [String(pickupZip).trim()]
  );
  return rows;
}

/**
 * Mark waitlist entries as notified (so we don't spam them repeatedly).
 */
async function markNotified(ids) {
  if (!ids || ids.length === 0) return;
  const { rows } = await db.query(
    `UPDATE driver_waitlist SET notified_at = NOW() WHERE id = ANY($1) RETURNING id`,
    [ids]
  );
  return rows;
}

module.exports = { addToWaitlist, getWaitlistByZip, markNotified };