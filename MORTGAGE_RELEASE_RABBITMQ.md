# Mortgage Release - RabbitMQ Implementation

## Summary
Changed mortgage release payment creation from HTTP call to RabbitMQ event-driven architecture for consistency with other flows.

## Changes Made

### 1. Removed axios Dependency
**File**: `backend-landregistry/services/mortgage.js`
- Removed `const axios = require('axios')`
- No longer need axios package in backend-landregistry

### 2. Updated createReleaseMortgage Function
**Before** (HTTP call):
```javascript
await axios.post(`${paymentServiceUrl}/api/payments`, {
  reference_id: mortgage.mortgage_id,
  reference_type: 'mortgage_release',
  amount: releaseAmount,
  description: `Mortgage Release Payment for ${mortgage.bank_name}`
});
```

**After** (RabbitMQ):
```javascript
await rabbitmq.publishToQueue('queue_payments', {
  event_type: 'CREATE_RELEASE_PAYMENT',
  mortgage_id: mortgage.mortgage_id,
  reference_id: mortgage.mortgage_id,
  reference_type: 'mortgage_release',
  amount: releaseAmount,
  description: `Mortgage Release Payment for ${mortgage.bank_name}`,
  user_id: user_id
});
```

### 3. Updated Tests
**File**: `backend-landregistry/__tests__/services/mortgage.test.js`
- Removed axios import and mock
- Updated test to check `rabbitmq.publishToQueue` instead of `axios.post`

## Flow Diagram

```
User clicks "Release Mortgage"
         ↓
Frontend calls API
         ↓
backend-landregistry: createReleaseMortgage()
         ↓
Publish to queue_payments
         ↓
backend-payments: Consumer listens
         ↓
Create payment record (PENDING)
         ↓
User goes to Payments page
         ↓
Confirm payment (PAID)
         ↓
Publish MORTGAGE_RELEASE_PAYMENT_CONFIRMED
         ↓
backend-landregistry: Consumer processes
         ↓
Update status: ACTIVE → RELEASED
         ↓
Record to blockchain
```

## Benefits of RabbitMQ Approach

1. **Consistency**: All services communicate via RabbitMQ
2. **Decoupling**: Services don't need to know each other's URLs
3. **Reliability**: Message queuing ensures delivery
4. **No HTTP dependencies**: No need for axios in land registry service
5. **Async processing**: Non-blocking operations
6. **Retry logic**: Built-in message retry on failure

## Next Steps (Backend Payments)

Need to add consumer handler for `CREATE_RELEASE_PAYMENT` event:

```javascript
case 'CREATE_RELEASE_PAYMENT':
  await paymentService.createPayment({
    reference_id: messageData.reference_id,
    reference_type: messageData.reference_type,
    amount: messageData.amount,
    description: messageData.description,
    created_by: messageData.user_id
  });
  break;
```

## Testing

All tests updated to use RabbitMQ mocks:
- ✅ Create release mortgage publishes to queue
- ✅ Event contains correct reference_type
- ✅ No axios dependency required
