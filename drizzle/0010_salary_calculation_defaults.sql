ALTER TABLE "salary_settings"
  ADD COLUMN IF NOT EXISTS "working_days_per_month" numeric(2, 0) NOT NULL DEFAULT 22,
  ADD COLUMN IF NOT EXISTS "hours_per_workday" numeric(4, 2) NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS "weekday_before_cutoff" numeric(4, 2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "weekday_after_cutoff" numeric(4, 2) NOT NULL DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS "weekend_multiplier" numeric(4, 2) NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "cutoff_time" varchar(5) NOT NULL DEFAULT '16:30';
