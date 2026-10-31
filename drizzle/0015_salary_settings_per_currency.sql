ALTER TABLE "salary_settings"
  DROP CONSTRAINT IF EXISTS "salary_settings_pkey";

ALTER TABLE "salary_settings"
  ADD CONSTRAINT "salary_settings_pkey" PRIMARY KEY ("user_id", "currency");
