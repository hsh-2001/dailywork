ALTER TABLE "ot_records"
  DROP COLUMN IF EXISTS "break_minutes",
  ADD COLUMN IF NOT EXISTS "break_start_time" timestamp,
  ADD COLUMN IF NOT EXISTS "break_end_time" timestamp;
