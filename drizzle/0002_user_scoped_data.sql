ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "user_id" varchar(255);
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "user_id" varchar(255);
ALTER TABLE "ot_records" ADD COLUMN IF NOT EXISTS "user_id" varchar(255);

UPDATE "notes"
SET "user_id" = (
  SELECT "auth_user_id" FROM "users"
  WHERE "email" = 'senghonghang@gmail.com' AND "auth_user_id" IS NOT NULL
)
WHERE "user_id" IS NULL;

UPDATE "projects"
SET "user_id" = (
  SELECT "auth_user_id" FROM "users"
  WHERE "email" = 'senghonghang@gmail.com' AND "auth_user_id" IS NOT NULL
)
WHERE "user_id" IS NULL;

UPDATE "ot_records"
SET "user_id" = (
  SELECT "auth_user_id" FROM "users"
  WHERE "email" = 'senghonghang@gmail.com' AND "auth_user_id" IS NOT NULL
)
WHERE "user_id" IS NULL;

ALTER TABLE "notes" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "ot_records" ALTER COLUMN "user_id" SET NOT NULL;

ALTER TABLE "notes"
  ADD CONSTRAINT "notes_user_id_users_auth_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users" ("auth_user_id");
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_user_id_users_auth_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users" ("auth_user_id");
ALTER TABLE "ot_records"
  ADD CONSTRAINT "ot_records_user_id_users_auth_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users" ("auth_user_id");

CREATE INDEX IF NOT EXISTS "notes_user_id_idx" ON "notes" ("user_id");
CREATE INDEX IF NOT EXISTS "projects_user_id_idx" ON "projects" ("user_id");
CREATE INDEX IF NOT EXISTS "ot_records_user_id_idx" ON "ot_records" ("user_id");
