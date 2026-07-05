ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS amount numeric(12,2);

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS wallet text;

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS network text;

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS withdrawal_type text;

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS package_id text;

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS package_name text;

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS fee numeric(12,2);

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS receive_amount numeric(12,2);

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS admin_note text;
