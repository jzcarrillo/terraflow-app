# Terraflow Test Suite

Consolidated Jest testing for all microservices.

## Services Covered

1. **Backend Land Registry** - Land titles, Payments, Transfers (45 tests)
2. **Backend Users** - User registration, activation (13 tests)
3. **Backend Documents** - Document upload, rollback (15 tests)
4. **Backend Blockchain** - Blockchain recording, rollback (26 tests)

**Total: 99 tests**

## Quick Start

### Run All Tests
```bash
./run-all-tests.sh
```

### Run All Tests with Coverage
```bash
./run-all-coverage.sh
```

## Individual Service Tests

### Land Registry Service
```bash
cd backend-landregistry
npm test                          # All tests
npm test landtitles.test.js       # Land titles only
npm test payments.test.js         # Payments only
npm test transfers.test.js        # Transfers only
npm run test:coverage             # With coverage
```

### Users Service
```bash
cd backend-users
npm test                          # All tests
npm run test:coverage             # With coverage
```

### Documents Service
```bash
cd backend-documents
npm test                          # All tests
npm run test:coverage             # With coverage
```

### Blockchain Service
```bash
cd backend-blockchain
npm test                          # All tests
npm run test:coverage             # With coverage
```

## Coverage Summary

| Service | Coverage | Tests |
|---------|----------|-------|
| Land Titles | 80% | 15 |
| Payments | 80.99% | 13 |
| Transfers | 77.31% | 16 |
| Users | 100% | 13 |
| Documents | 100% | 15 |
| Blockchain | 98.3% | 26 |

## Test Structure

```
terraflow-app/
├── backend-landregistry/
│   ├── __tests__/services/
│   │   ├── landtitles.test.js
│   │   ├── payments.test.js
│   │   └── transfers.test.js
│   └── jest.config.js
├── backend-users/
│   ├── __tests__/services/
│   │   └── users.test.js
│   └── jest.config.js
├── backend-documents/
│   ├── __tests__/services/
│   │   └── document.test.js
│   └── jest.config.js
├── backend-blockchain/
│   ├── __tests__/services/
│   │   └── chaincode-service.test.js
│   └── jest.config.js
├── run-all-tests.sh          # Run all tests
├── run-all-coverage.sh       # Run all coverage
└── TESTING.md                # This file
```

## What's Tested

### Land Registry Service
- ✅ Land title creation with PENDING status
- ✅ Business rules (duplicates, status transitions)
- ✅ Blockchain integration on ACTIVE status
- ✅ Payment cancellation and reactivation
- ✅ Transfer creation and completion
- ✅ Rollback scenarios

### Users Service
- ✅ User registration with validation
- ✅ User activation
- ✅ User deletion
- ✅ Duplicate email/username checks
- ✅ Error handling

### Documents Service
- ✅ Document upload after land title success
- ✅ Store documents in database
- ✅ Validation (no attachments)
- ✅ Rollback on service failure
- ✅ Delete files on rollback
- ✅ Event publishing to land registry

### Blockchain Service
- ✅ Record land title on ACTIVE status
- ✅ Record cancellation on CANCELLED status
- ✅ Record reactivation on RE-ACTIVATED status
- ✅ Record transfer on TRANSFER_COMPLETED status
- ✅ Store blockchain hashes in database
- ✅ Rollback on blockchain service down
- ✅ Query operations and history

## Notes

- Tests focus on **service layer** (business logic)
- Controllers, routes, and middleware are not tested (POC scope)
- All tests use mocks for database, RabbitMQ, and external services
- Coverage target: 70-80% for production, current POC: 26-100% per service
