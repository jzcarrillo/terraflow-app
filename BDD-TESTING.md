# BDD Testing with Multiple Cucumber HTML Reporter

## Setup Complete ✅

The project now uses `multiple-cucumber-html-reporter` for enhanced BDD test reporting.

## Available Commands

### Run Individual Feature Tests
```bash
npm run bdd:landtitle   # Land title registration tests
npm run bdd:auth        # User authentication tests
npm run bdd:payment     # Payment processing tests
npm run bdd:transfer    # Land transfer tests
```

### Run All Tests
```bash
npm run bdd:all         # Run all BDD tests
```

### Generate & View Report
```bash
npm run bdd:report      # Generate HTML report and open in browser
```

### Full Test Suite with Report
```bash
npm run bdd:full        # Run all tests + generate report + open browser
```

## Report Features

The generated report includes:
- ✅ Test execution summary
- ✅ Pass/Fail statistics
- ✅ Detailed scenario breakdowns
- ✅ Step-by-step execution logs
- ✅ Execution metadata (platform, date, version)
- ✅ Interactive HTML interface

## Report Location

After running tests, the report is available at:
```
bdd-reports/html/index.html
```

## Report Customization

Edit `generate-report.js` to customize:
- Project metadata
- Report styling
- Custom data fields
- Browser/platform information

## Example Workflow

```bash
# 1. Run all BDD tests and generate report
npm run bdd:full

# 2. Or run tests separately, then generate report
npm run bdd:all
npm run bdd:report
```

## Files Structure

```
terraflow-app/
├── features/
│   ├── *.feature              # Gherkin scenarios
│   └── step_definitions/      # Step implementations
├── bdd-reports/
│   ├── bdd-report.json        # Raw JSON results
│   └── html/
│       └── index.html         # Generated HTML report
└── generate-report.js         # Report generator script
```
