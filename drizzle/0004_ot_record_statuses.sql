ALTER TABLE "ot_records"
  ADD COLUMN IF NOT EXISTS "booking_status" varchar(30) NOT NULL DEFAULT 'PENDING';

ALTER TABLE "ot_records"
  ADD COLUMN IF NOT EXISTS "submit_status" varchar(30) NOT NULL DEFAULT 'NOT_SUBMITTED';
