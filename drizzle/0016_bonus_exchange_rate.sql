ALTER TABLE IF EXISTS "bonus_calculation_settings"
  ADD COLUMN IF NOT EXISTS "khr_per_usd" numeric(12, 4) NOT NULL DEFAULT 4000;
