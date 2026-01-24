-- Add transfer_id column to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS transfer_id VARCHAR(255);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_transfer_id ON payments(transfer_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name = 'transfer_id';
