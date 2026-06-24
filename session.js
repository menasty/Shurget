// middleware/session.js — Admin session auth
// Simple signed-cookie sessions using Node.js crypto. No external deps.
// Session data stored in memory (resets on app restart — fine for single-instance admin).
const crypto = require('crypto');
const sessions = new Map(); // sessionId -> { createdAt, adminEmail }

const SESSION_COOKIE = 'ha_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');

function signSession(sessionId) {
  const hmac = crypto.createHmac('sha256', COOKIE_SECRET);
  hmac.update(sessionId);
  return sessionId + '.' + hmac.digest('base64url');
}

function unsign(cookie) {
  if (!cookie || typeof cookie !== 'string') return null;
  const parts = cookie.split('.');
  if (parts.length !== 2) return null;
  const [sessionId, sig] = parts;
  const expected = signSession(sessionId).split('.')[1];
  if (sig !== expected) return null;
  return sessionId;
}

function createSession(adminEmail) {
  const id = crypto.randomBytes(32).toString('base64url');
  sessions.set(id, { createdAt: Date.now(), adminEmail });
  return id;
}

function destroySession(sessionId) {
  sessions.delete(sessionId);
}

function getSession(sessionId) {
  if (!sessionId) return null;
  const sess = sessions.get(sessionId);
  if (!sess) return null;
  if (Date.now() - sess.createdAt > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }
  return sess;
}

function validateCredentials(username, password) {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return false;
  return username === adminUser && password === adminPass;
}

function requireAdmin(req, res, next) {
  const cookie = req.cookies?.[SESSION_COOKIE];
  const sessionId = unsign(cookie);
  const session = getSession(sessionId);

  if (!session) {
    // API routes get a 401; page routes get a redirect
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect('/admin/login');
  }

  req.adminEmail = session.adminEmail;
  next();
}

module.exports = {
  SESSION_COOKIE,
  createSession,
  destroySession,
  getSession,
  signSession,
  unsign,
  validateCredentials,
  requireAdmin,
};