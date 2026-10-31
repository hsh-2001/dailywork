ALTER TABLE IF EXISTS "bonus_calculation_settings"
  ADD COLUMN IF NOT EXISTS "weekday_multiplier" numeric(4, 2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "normal_holiday_multiplier" numeric(4, 2) NOT NULL DEFAULT 2;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'bonus_calculation_settings'
      AND column_name = 'weekday_before_cutoff'
  ) THEN
    EXECUTE '
      UPDATE bonus_calculation_settings
      SET weekday_multiplier = weekday_before_cutoff
    ';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'ot_records'
      AND column_name = 'is_special_day'
  ) THEN
    EXECUTE $sql$
      UPDATE ot_records
      SET note = CASE
        WHEN COALESCE(note, '') = '' THEN 'special day'
        ELSE note || E'\n' || 'special day'
      END
      WHERE is_special_day = true
        AND COALESCE(note, '') !~* 'special[ _-]+day'
    $sql$;
  END IF;
END $$;

ALTER TABLE IF EXISTS "bonus_calculation_settings"
  DROP COLUMN IF EXISTS "weekday_before_cutoff",
  DROP COLUMN IF EXISTS "weekday_after_cutoff",
  DROP COLUMN IF EXISTS "cutoff_time";

ALTER TABLE IF EXISTS "ot_records"
  DROP COLUMN IF EXISTS "is_special_day";
