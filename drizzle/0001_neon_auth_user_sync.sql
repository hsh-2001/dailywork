CREATE TABLE IF NOT EXISTS "users" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "username" varchar(255) NOT NULL CONSTRAINT "users_username_unique" UNIQUE,
  "email" varchar(255) NOT NULL CONSTRAINT "users_email_unique" UNIQUE,
  "auth_user_id" varchar(255),
  "name" varchar(255),
  "image" varchar(2048),
  "phone" varchar(20) CONSTRAINT "users_phone_unique" UNIQUE,
  "password" varchar(255),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "modified_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_user_id" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" varchar(2048);
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_user_id_unique" ON "users" ("auth_user_id");
