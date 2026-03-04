-- Mortgage Simplification Migration
-- Run this in your PostgreSQL database

ALTER TABLE mortgages ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE mortgages ALTER COLUMN interest_rate DROP NOT NULL;
ALTER TABLE mortgages ALTER COLUMN term_years DROP NOT NULL;
