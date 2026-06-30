const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const INVALID_DB_HOSTS = new Set(['', 'base', 'localhost', '127.0.0.1', '::1']);

function normalize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeDatabaseUrl(value) {
  let sanitized = normalize(value);
  if (!sanitized) return '';

  // Support accidental env-file style values, e.g. DATABASE_URL="postgres://..."
  const prefixed = sanitized.match(/^DATABASE_URL\s*=\s*(.+)$/i);
  if (prefixed) {
    sanitized = prefixed[1].trim();
  }

  if (
    (sanitized.startsWith('"') && sanitized.endsWith('"')) ||
    (sanitized.startsWith("'") && sanitized.endsWith("'"))
  ) {
    sanitized = sanitized.slice(1, -1).trim();
  }

  return sanitized;
}

function isInvalidHost(hostname) {
  return INVALID_DB_HOSTS.has(normalize(hostname).toLowerCase());
}

function hasCompletePgConfig(pgHost, pgUser, pgDatabase) {
  return Boolean(pgHost && pgUser && pgDatabase && !isInvalidHost(pgHost));
}

/**
 * Strip sslmode from a connection string so pg v8.11+ does not emit the
 * "SECURITY WARNING: … treated as alias for verify-full" message.
 * We handle SSL explicitly via the `ssl` pool config key instead.
 */
function stripSslMode(connectionString) {
  try {
    const parsed = new URL(connectionString);
    parsed.searchParams.delete('sslmode');
    return parsed.toString();
  } catch (_) {
    return connectionString;
  }
}

function buildPoolConfig() {
  const rawDatabaseUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL);
  const pgHost = normalize(process.env.PGHOST);
  const pgUser = normalize(process.env.PGUSER);
  const pgPassword = normalize(process.env.PGPASSWORD);
  const pgDatabase = normalize(process.env.PGDATABASE);
  const pgPort = Number.parseInt(normalize(process.env.PGPORT) || '5432', 10);

  // Prefer DATABASE_URL but repair common placeholder host mistakes.
  if (rawDatabaseUrl) {
    try {
      const parsed = new URL(rawDatabaseUrl);
      if (isInvalidHost(parsed.hostname) && pgHost && !isInvalidHost(pgHost)) {
        parsed.hostname = pgHost;
        if (Number.isFinite(pgPort)) {
          parsed.port = String(pgPort);
        }
        // Strip sslmode — we set ssl explicitly below
        parsed.searchParams.delete('sslmode');
        return { connectionString: parsed.toString() };
      }

      if (!isInvalidHost(parsed.hostname)) {
        // Strip sslmode — we set ssl explicitly below to avoid pg v8.11+ warning
        return { connectionString: stripSslMode(rawDatabaseUrl) };
      }

      console.warn(`[db] Ignoring DATABASE_URL with invalid hostname: ${parsed.hostname}`);
    } catch (error) {
      console.warn('[db] Ignoring invalid DATABASE_URL format and trying PG* env vars');
    }
  }

  // Fallback to discrete PG* vars when DATABASE_URL is missing or invalid.
  if (hasCompletePgConfig(pgHost, pgUser, pgDatabase)) {
    return {
      host: pgHost,
      port: Number.isFinite(pgPort) ? pgPort : 5432,
      user: pgUser,
      password: pgPassword,
      database: pgDatabase
    };
  }

  throw new Error(
    '[db] Missing valid PostgreSQL configuration. Set DATABASE_URL to a real remote host or set PGHOST/PGUSER/PGPASSWORD/PGDATABASE (PGHOST cannot be localhost/base in production).'
  );
}

const poolConfig = buildPoolConfig();

// Always set ssl explicitly. pg v8.11+ emits a security warning when sslmode
// is passed via the connection string ('prefer'/'require'/'verify-ca' are all
// treated as 'verify-full'). Setting ssl via the pool config key is the
// correct, warning-free approach. rejectUnauthorized: true enforces full
// certificate validation, which is what Neon and other managed PG hosts expect.
poolConfig.ssl = { rejectUnauthorized: true };

const pool = new Pool(poolConfig);

function query(text, params) {
  return pool.query(text, params);
}

function connect() {
  return pool.connect();
}

function end() {
  return pool.end();
}

module.exports = { pool, query, connect, end };
