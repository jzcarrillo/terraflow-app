# Playwright E2E Testing

End-to-end testing for Terraflow Land Registry System.

## Setup

```bash
npm install
npx playwright install chromium
```

## Run Tests

```bash
# Run all E2E tests (headless)
npm run e2e

# Run with UI mode (interactive)
npm run e2e:ui

# Run with browser visible
npm run e2e:headed

# View test report
npm run e2e:report
```

## Test Scenarios

1. **Land Title Registration** - Complete registration flow
2. **Document Validation** - Error handling for missing documents
3. **Payment Processing** - Payment and activation flow
4. **Search Functionality** - Search land title by number
5. **List View** - Display all land titles
6. **Payment Cancellation** - Cancel and revert status
7. **Duplicate Prevention** - Handle duplicate title numbers

## Test Files

- `e2e/land-title-registration.spec.js` - Main E2E test suite

## Configuration

- `playwright.config.js` - Playwright configuration
- Base URL: `http://localhost:3000`
- Browser: Chromium
- Timeout: 30 seconds
- Screenshots: On failure only
- Trace: On first retry

## Notes

- Make sure the frontend app is running on `http://localhost:3000`
- Test files should be in `./test-files/` directory
- Reports are generated in `playwright-report/` directory
