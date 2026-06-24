// db/quote_requests.js — Quote request CRUD
// Owns: quote_requests table access
// Does NOT own: email sending (services/email handles that)

const db = require('./index');

/** Insert a new quote request. Returns the created row. */
async function createQuoteRequest(data) {
  const { rows } = await db.query(
    `INSERT INTO quote_requests (name, email, phone, item_description, pickup_address, dropoff_address)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.name         || '',
      data.email        || '',
      data.phone        || null,
      data.itemDescription || data.item_description || null,
      data.pickupAddress  || null,
      data.dropoffAddress || null,
    ]
  );
  return rows[0];
}

/** Fetch quote request by id. */
async function getQuoteRequestById(id) {
  const { rows } = await db.query('SELECT * FROM quote_requests WHERE id = $1', [id]);
  return rows[0] || null;
}

/** Insert a partner pilot lead (lead_type='partner'). Returns the created row. */
async function createPartnerLead(data) {
  const { rows } = await db.query(
    `INSERT INTO quote_requests
       (name, email, phone, item_description, lead_type, company_name, monthly_volume, zip_codes_served)
     VALUES ($1, $2, $3, $4, 'partner', $5, $6, $7)
     RETURNING *`,
    [
      data.name         || '',
      data.email        || '',
      data.phone        || null,
      data.itemDescription || null,
      data.companyName  || null,
      data.monthlyVolume || null,
      data.zipCodesServed || null,
    ]
  );
  return rows[0];
}

/** Get all quote requests (for admin). */
async function getAllQuoteRequests() {
  const { rows } = await db.query('SELECT * FROM quote_requests ORDER BY created_at DESC LIMIT 100');
  return rows;
}

module.exports = { createQuoteRequest, getQuoteRequestById, createPartnerLead, getAllQuoteRequests };