CREATE TABLE IF NOT EXISTS "bonus_calculation_settings" (
  "user_id" varchar(255) PRIMARY KEY NOT NULL REFERENCES "users"("user_id") ON DELETE CASCADE,
  "working_days_per_month" numeric(2, 0) NOT NULL DEFAULT 22,
  "hours_per_workday" numeric(4, 2) NOT NULL DEFAULT 8,
  "weekday_before_cutoff" numeric(4, 2) NOT NULL DEFAULT 1,
  "weekday_after_cutoff" numeric(4, 2) NOT NULL DEFAULT 1.5,
  "weekend_multiplier" numeric(4, 2) NOT NULL DEFAULT 2,
  "cutoff_time" varchar(5) NOT NULL DEFAULT '16:30',
  "updated_at" timestamp NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'salary_settings'
      AND column_name IN (
        'working_days_per_month',
        'hours_per_workday',
        'weekday_before_cutoff',
        'weekday_after_cutoff',
        'weekend_multiplier',
        'cutoff_time'
      )
  ) = 6 THEN
    EXECUTE '
      INSERT INTO bonus_calculation_settings (
        user_id,
        working_days_per_month,
        hours_per_workday,
        weekday_before_cutoff,
        weekday_after_cutoff,
        weekend_multiplier,
        cutoff_time
      )
      SELECT
        user_id,
        working_days_per_month,
        hours_per_workday,
        weekday_before_cutoff,
        weekday_after_cutoff,
        weekend_multiplier,
        cutoff_time
      FROM salary_settings
      ON CONFLICT (user_id) DO NOTHING
    ';
  END IF;
END $$;

ALTER TABLE IF EXISTS "salary_settings"
  DROP COLUMN IF EXISTS "working_days_per_month",
  DROP COLUMN IF EXISTS "hours_per_workday",
  DROP COLUMN IF EXISTS "weekday_before_cutoff",
  DROP COLUMN IF EXISTS "weekday_after_cutoff",
  DROP COLUMN IF EXISTS "weekend_multiplier",
  DROP COLUMN IF EXISTS "cutoff_time";
