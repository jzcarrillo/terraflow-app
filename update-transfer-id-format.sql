-- Update transfer_id column to VARCHAR for TRF-YYYY-TIMESTAMP format
ALTER TABLE land_transfers DROP CONSTRAINT IF EXISTS land_transfers_pkey;
ALTER TABLE land_transfers ALTER COLUMN transfer_id TYPE VARCHAR(50);
ALTER TABLE land_transfers ADD PRIMARY KEY (transfer_id);

-- Update payments table transfer_id column to match
ALTER TABLE payments ALTER COLUMN transfer_id TYPE VARCHAR(50);
