-- Migration: add electronic signature fields to driver_applications
-- Run once. All new columns are nullable so existing rows are unaffected.
ALTER TABLE driver_applications
  ADD COLUMN IF NOT EXISTS agreement_signed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS agreement_signature   TEXT,   -- typed full legal name
  ADD COLUMN IF NOT EXISTS agreement_ip          TEXT,   -- IP at time of signing
  ADD COLUMN IF NOT EXISTS agreement_version     TEXT DEFAULT '1.0';
