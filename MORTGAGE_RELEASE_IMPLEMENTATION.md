# Mortgage Release Implementation

## Overview
Complete implementation of mortgage release flow from ACTIVE → RELEASED status with blockchain recording and payment confirmation.

## User Flow

### Step 1: Initiate Release (Mortgages Page)
1. User navigates to **Mortgages** page
2. Finds ACTIVE mortgage in the list
3. Clicks **Actions menu (⋮)** on the mortgage row
4. Selects **"Release Mortgage"** option
5. Confirmation dialog appears showing mortgage details
6. User confirms → Release payment is created
7. Success message: "Release payment created. Please proceed to Payments to complete."

### Step 2: Pay Release Fee (Payments Page)
1. User navigates to **Payments** page
2. Clicks **"Create Payment"** button
3. Selects **Reference Type: "Mortgage Release"** from dropdown
4. Dropdown shows all ACTIVE mortgages
5. Selects the mortgage to release
6. Amount is auto-filled (1% of mortgage amount as release fee)
7. User confirms payment
8. Payment status: PENDING → PAID

### Step 3: Automatic Processing (Backend)
1. Payment service publishes `MORTGAGE_RELEASE_PAYMENT_CONFIRMED` event
2. Land registry consumer processes the event
3. Mortgage status updated: ACTIVE → RELEASED
4. Blockchain records release transaction with:
   - mortgage_id (MTG-2026-xxx format)
   - title_number (LT-2026-xxx format)
   - bank_name, amount
   - previous_status: ACTIVE, new_status: RELEASED
5. release_blockchain_hash stored in database

### Step 4: Verify Release (Mortgages & Land Titles Pages)
1. **Mortgages page**: Status chip shows "RELEASED"
2. **Land Title Details**: Blockchain table shows two entries:
   - "Mortgage" (violet chip) - original mortgage activation
   - "Mortgage Released" (pink chip) - mortgage release transaction

## Technical Implementation

### 1. Backend Payments Service
**File**: `backend-payments/services/payments.js`

Added mortgage_release event publishing:
```javascript
else if (payment.reference_type === 'mortgage_release') {
  await rabbitmq.publishToQueue(QUEUES.LAND_REGISTRY, {
    event_type: 'MORTGAGE_RELEASE_PAYMENT_CONFIRMED',
    transaction_id: transactionId,
    payment_id: payment.id,
    mortgage_id: payment.reference_id,
    payment_status: status,
    message_key: messageKey,
    timestamp: new Date().toISOString()
  });
}
```

### 2. Backend Land Registry Consumer
**File**: `backend-landregistry/services/consumer.js`

Added event handler:
```javascript
case 'MORTGAGE_RELEASE_PAYMENT_CONFIRMED':
  await payments.processMortgageReleasePaymentConfirmed(messageData);
  break;
```

### 3. Backend Land Registry Payments Service
**File**: `backend-landregistry/services/payments.js`

**Added function**: `processMortgageReleasePaymentConfirmed()`
- Processes mortgage release payment confirmation
- Calls `handleMortgageReleasePayment()` with mortgage_id and status

**Updated function**: `handleMortgageReleasePayment()`
- Accepts both mortgage_id string (MTG-xxx) and integer ID
- Updates mortgage status to RELEASED
- Records release to blockchain with:
  - mortgage_id string (not database ID)
  - title_number (fetched from land_titles table)
  - bank_name, amount, previous_status, new_status
- Stores release_blockchain_hash in mortgages table
- Handles payment cancellation (reverts to ACTIVE)

### 4. Frontend Land Titles Page
**File**: `frontend/src/app/land-titles/page.js`

Updated blockchain table to display RELEASED mortgages:
- Shows both blockchain_hash (ACTIVE) and release_blockchain_hash (RELEASED)
- "Mortgage" chip: violet (#9c27b0)
- "Mortgage Released" chip: pink (#e91e63)
- Displays bank name and amount for both entries

### 5. Backend Land Registry Mortgage Service
**File**: `backend-landregistry/services/mortgage.js`

**Existing function**: `createReleaseMortgage()`
- Creates release payment via HTTP POST to payments service
- Calculates release fee as 1% of mortgage amount
- Uses mortgage_id string (MTG-xxx) as reference_id

## Database Schema

### Mortgages Table
- `blockchain_hash`: Stores hash when mortgage becomes ACTIVE
- `release_blockchain_hash`: Stores hash when mortgage is RELEASED
- `status`: PENDING → ACTIVE → RELEASED

## Status Flow

```
PENDING (created) 
  ↓ (pay annotation fee)
ACTIVE (mortgage active)
  ↓ (click "Release Mortgage" → pay release fee)
RELEASED (mortgage released)
```

## Blockchain Recording

### Mortgage Activation (Existing)
```javascript
{
  mortgage_id: "MTG-2026-1234567890",
  land_title_id: "LT-2026-1234567890",
  bank_name: "BDO",
  amount: 1000000,
  status: "ACTIVE",
  timestamp: 1234567890,
  transaction_id: "TXN-xxx"
}
```

### Mortgage Release (New)
```javascript
{
  mortgage_id: "MTG-2026-1234567890",
  land_title_id: "LT-2026-1234567890",
  bank_name: "BDO",
  amount: 1000000,
  previous_status: "ACTIVE",
  new_status: "RELEASED",
  timestamp: 1234567890,
  transaction_id: "TXN-xxx"
}
```

## Payment Reference Types

1. `land_title` - Land title registration fee
2. `transfer` - Transfer fee
3. `mortgage` - Mortgage annotation fee (shows PENDING mortgages)
4. **`mortgage_release`** - Mortgage release fee (shows ACTIVE mortgages) ← NEW

## Frontend Display

### Mortgages Page
- Status chip colors:
  - PENDING: default
  - ACTIVE: success (green)
  - RELEASED: default (gray)
  - CANCELLED: error (red)

### Land Title Details - Blockchain Table
| Blockchain Hash | Action | Timestamp | Details |
|----------------|--------|-----------|---------|
| 0xabc123... | Mortgage (violet) | 2024-01-15 | Bank: BDO<br>Amount: ₱1,000,000 |
| 0xdef456... | Mortgage Released (pink) | 2024-02-20 | Bank: BDO<br>Amount: ₱1,000,000 |

## Testing Checklist

- [ ] Create mortgage → Status: PENDING
- [ ] Pay mortgage annotation fee → Status: ACTIVE
- [ ] Verify blockchain_hash stored
- [ ] Click "Release Mortgage" → Payment created
- [ ] Go to Payments → Select "Mortgage Release"
- [ ] Confirm payment → Status: RELEASED
- [ ] Verify release_blockchain_hash stored
- [ ] Check Mortgages page → Status shows RELEASED
- [ ] Check Land Title Details → Two blockchain entries visible
- [ ] Verify mortgage chip is violet
- [ ] Verify mortgage released chip is pink

## Notes

- Release fee is 1% of mortgage amount (configurable in createReleaseMortgage function)
- Mortgage must be ACTIVE to be released
- Both blockchain hashes are preserved in database
- Frontend displays both ACTIVE and RELEASED transactions in chronological order
- Encumbrances field update is optional (not implemented in this version)
