require('dotenv').config();

const { Pool } = require('pg');

function normalizeEnvValue(rawValue) {
  return (rawValue || '')
    .replace(/^\s*DATABASE_URL\s*=\s*/i, '')
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

function getDatabaseUrlFromEnv() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRESQL_URL
  ];

  for (const candidate of candidates) {
    const normalized = normalizeEnvValue(candidate);
    if (normalized) return normalized;
  }

  return '';
}

function buildPoolConfig() {
  const databaseUrl = getDatabaseUrlFromEnv();

  if (databaseUrl) {
    let parsed;
    try {
      parsed = new URL(databaseUrl);
    } catch {
      throw new Error(
        'Invalid DATABASE_URL format. Use a full Postgres URL like postgresql://user:pass@host:5432/dbname'
      );
    }

    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
      throw new Error('DATABASE_URL must start with postgres:// or postgresql://');
    }

    if (!parsed.hostname || parsed.hostname.toLowerCase() === 'base') {
      throw new Error(
        'DATABASE_URL hostname is invalid (received "base"). In Render, set DATABASE_URL to your real Postgres connection string.'
      );
    }

    const databaseName = parsed.pathname.replace(/^\//, '');

    return {
      connectionString: databaseUrl,
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username || ''),
      password: decodeURIComponent(parsed.password || ''),
      database: databaseName ? decodeURIComponent(databaseName) : undefined
    };
  }

  const host = normalizeEnvValue(process.env.PGHOST);
  const user = normalizeEnvValue(process.env.PGUSER);
  const password = normalizeEnvValue(process.env.PGPASSWORD);
  const database = normalizeEnvValue(process.env.PGDATABASE);
  const port = Number(process.env.PGPORT || 5432);

  if (host && user && database) {
    if (host.toLowerCase() === 'base') {
      throw new Error(
        'PGHOST is set to "base", which is not resolvable. Set PGHOST to your actual database hostname.'
      );
    }

    return {
      host,
      user,
      password,
      database,
      port
    };
  }

  throw new Error(
    'Missing database config. Set DATABASE_URL (recommended) or PGHOST/PGUSER/PGPASSWORD/PGDATABASE.'
  );
}

function getSafeDbHostLabel(poolConfig) {
  if (poolConfig.connectionString) {
    try {
      return new URL(poolConfig.connectionString).hostname || 'unknown-host';
    } catch {
      return 'unknown-host';
    }
  }

  return poolConfig.host || 'unknown-host';
}

const poolConfig = buildPoolConfig();

console.log(`[db] Using PostgreSQL host: ${getSafeDbHostLabel(poolConfig)}`);

const pool = new Pool({
  ...poolConfig,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = { pool };
