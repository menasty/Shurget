-- schema.sql — Shurget base database schema
-- Generated from migrate.js on 2026-06-29
-- Run this on a fresh Neon database to recreate the full schema from scratch.
-- Safe to re-run: all statements use IF NOT EXISTS.
--
-- Usage:
--   psql $DATABASE_URL -f schema.sql

-- ─── Orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                          SERIAL PRIMARY KEY,
  -- Core booking fields
  item_type                   TEXT,
  pickup_address              TEXT,
  dropoff_address             TEXT,
  helpers                     INTEGER DEFAULT 0,
  notes                       TEXT,
  scheduled_time              TIMESTAMPTZ,
  -- Status lifecycle
  status                      TEXT DEFAULT 'pending',
  paid_at                     TIMESTAMPTZ,
  confirmed_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  -- Stripe
  stripe_session_id           TEXT,
  -- Pricing
  price_total                 NUMERIC(10,2),
  price_base                  NUMERIC(10,2),
  price_fee                   NUMERIC(10,2),
  -- Geo
  pickup_lat                  DOUBLE PRECISION,
  pickup_lng                  DOUBLE PRECISION,
  dropoff_lat                 DOUBLE PRECISION,
  dropoff_lng                 DOUBLE PRECISION,
  distance_miles              DOUBLE PRECISION,
  -- Customer contact
  customer_name               TEXT,
  customer_phone              TEXT,
  customer_email              TEXT,
  -- Driver assignment
  driver_id                   INTEGER,
  driver_name                 TEXT,
  driver_phone                TEXT,
  driver_status               TEXT,
  driver_lat                  DOUBLE PRECISION,
  driver_lng                  DOUBLE PRECISION,
  driver_location_updated_at  TIMESTAMPTZ,
  eta_minutes                 INTEGER,
  -- Claim hold (race-safety for driver job acceptance)
  claim_hold_driver_id        INTEGER,
  claim_hold_expires_at       TIMESTAMPTZ,
  -- Referral & partner
  referral_code_used          TEXT,
  referral_discount_cents     INTEGER DEFAULT 0,
  partner_slug                TEXT,
  -- SMS
  sms_consent                 BOOLEAN DEFAULT FALSE,
  sms_unsubscribed            BOOLEAN DEFAULT FALSE,
  -- UTM attribution
  utm_source_first            TEXT,
  utm_medium_first            TEXT,
  utm_campaign_first          TEXT,
  utm_source_last             TEXT,
  utm_medium_last             TEXT,
  utm_campaign_last           TEXT,
  -- Payout tracking
  stripe_transfer_id          TEXT,
  payout_status               TEXT DEFAULT 'pending',
  -- Review email scheduling
  scheduled_review_email_at   TIMESTAMPTZ,
  review_email_sent_at        TIMESTAMPTZ,
  -- Lifecycle email idempotency
  status_emails_sent          JSONB DEFAULT '{}'::jsonb
);

-- ─── Driver Applications ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_applications (
  id                      SERIAL PRIMARY KEY,
  name                    TEXT NOT NULL,
  email                   TEXT NOT NULL UNIQUE,
  phone                   TEXT,
  city                    TEXT,
  vehicle_year            TEXT,
  vehicle_make            TEXT,
  vehicle_model           TEXT,
  vehicle_color           TEXT,
  vehicle_plate           TEXT,
  vehicle_insurance_doc   TEXT,
  drivers_license_doc     TEXT,
  status                  TEXT DEFAULT 'pending',
  approved_at             TIMESTAMPTZ,
  stripe_account_id       TEXT,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Driver Ratings ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_ratings (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL UNIQUE,
  driver_id   INTEGER,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  source      TEXT DEFAULT 'email',
  token_used  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Driver Rating Disputes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_rating_disputes (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL UNIQUE,
  driver_id   INTEGER,
  rating      INTEGER,
  comment     TEXT,
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'open',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Driver Waitlist ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_waitlist (
  id           SERIAL PRIMARY KEY,
  email        TEXT NOT NULL,
  pickup_zip   TEXT,
  dropoff_zip  TEXT,
  item_type    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Referral Codes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_codes (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  owner_email TEXT NOT NULL,
  max_uses    INTEGER,
  use_count   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Referral Redemptions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_redemptions (
  id             SERIAL PRIMARY KEY,
  code_id        INTEGER NOT NULL REFERENCES referral_codes(id),
  referee_email  TEXT NOT NULL,
  order_id       INTEGER,
  credit_amount  NUMERIC(10,2),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Partner Applications ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_applications (
  id          SERIAL PRIMARY KEY,
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  website     TEXT,
  city        TEXT,
  use_case    TEXT,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Partners ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id                 SERIAL PRIMARY KEY,
  slug               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  email              TEXT,
  phone              TEXT,
  stripe_account_id  TEXT,
  commission_rate    NUMERIC(5,4) DEFAULT 0.10,
  active             BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
