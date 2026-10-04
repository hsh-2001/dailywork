DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'users'
      AND column_name = 'auth_user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'users'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE "users" RENAME COLUMN "auth_user_id" TO "user_id";
  END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "user_id" DROP NOT NULL;

DO $$
BEGIN
  IF to_regclass('users_auth_user_id_unique') IS NOT NULL
    AND to_regclass('users_user_id_unique') IS NULL THEN
    ALTER INDEX "users_auth_user_id_unique" RENAME TO "users_user_id_unique";
  END IF;
END $$;

DO $$
DECLARE
  constraint_record record;
BEGIN
  FOR constraint_record IN
    SELECT * FROM (VALUES
      ('notes', 'notes_user_id_users_auth_user_id_fk', 'notes_user_id_users_user_id_fk'),
      ('projects', 'projects_user_id_users_auth_user_id_fk', 'projects_user_id_users_user_id_fk'),
      ('ot_records', 'ot_records_user_id_users_auth_user_id_fk', 'ot_records_user_id_users_user_id_fk')
    ) AS constraints(table_name, old_name, new_name)
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = to_regclass(format('%I.%I', current_schema(), constraint_record.table_name))
        AND conname = constraint_record.old_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.%I RENAME CONSTRAINT %I TO %I',
        current_schema(),
        constraint_record.table_name,
        constraint_record.old_name,
        constraint_record.new_name
      );
    END IF;
  END LOOP;
END $$;
