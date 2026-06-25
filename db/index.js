const { Pool } = require('pg');

const INVALID_DB_HOSTS = new Set(['base']);

function normalize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isInvalidHost(hostname) {
  return INVALID_DB_HOSTS.has(normalize(hostname).toLowerCase());
}

function buildPoolConfig() {
  const rawDatabaseUrl = normalize(process.env.DATABASE_URL);
  const pgHost = normalize(process.env.PGHOST);
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
        return { connectionString: parsed.toString() };
      }

      if (!isInvalidHost(parsed.hostname)) {
        return { connectionString: rawDatabaseUrl };
      }
    } catch (error) {
      console.warn('[db] Ignoring invalid DATABASE_URL format and trying PG* env vars');
    }
  }

  // Fallback to discrete PG* vars when DATABASE_URL is missing or invalid.
  return {
    host: pgHost,
    port: Number.isFinite(pgPort) ? pgPort : 5432,
    user: normalize(process.env.PGUSER),
    password: normalize(process.env.PGPASSWORD),
    database: normalize(process.env.PGDATABASE)
  };
}

const pool = new Pool({
  ...buildPoolConfig(),
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = { pool };
