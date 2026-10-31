CREATE TABLE IF NOT EXISTS "salary_settings" (
  "user_id" varchar(255) PRIMARY KEY NOT NULL,
  "monthly_salary" numeric(14, 2) NOT NULL DEFAULT 0,
  "currency" varchar(3) NOT NULL DEFAULT 'USD',
  "tax_rate" numeric(5, 2) NOT NULL DEFAULT 0,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "salary_settings_user_id_users_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE
);
