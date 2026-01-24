-- Update existing transfer payments with their transfer_id
-- This fixes payments created before transfer_id was added to the flow

-- First, check which payments need updating
SELECT 
  p.payment_id, 
  p.reference_id, 
  p.reference_type, 
  p.transfer_id,
  t.transfer_id as actual_transfer_id
FROM payments p
LEFT JOIN land_transfers t ON p.reference_id = t.title_number
WHERE p.reference_type = 'Transfer Title' 
  AND p.transfer_id IS NULL;

-- Update payments with their corresponding transfer_id
UPDATE payments p
SET transfer_id = t.transfer_id
FROM land_transfers t
WHERE p.reference_id = t.title_number
  AND p.reference_type = 'Transfer Title'
  AND p.transfer_id IS NULL;

-- Verify the update
SELECT payment_id, reference_id, reference_type, transfer_id, status
FROM payments
WHERE reference_type = 'Transfer Title';
