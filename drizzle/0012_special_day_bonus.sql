ALTER TABLE IF EXISTS "ot_records"
  ADD COLUMN IF NOT EXISTS "is_special_day" boolean NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS "bonus_calculation_settings"
  ADD COLUMN IF NOT EXISTS "special_day_multiplier" numeric(4, 2) NOT NULL DEFAULT 2;
