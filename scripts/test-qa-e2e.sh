#!/bin/bash

echo "🧪 Running E2E Tests on QA Environment"
echo ""

# Step 1: Clean QA databases
echo "🗑️  Cleaning QA databases..."
kubectl exec -n terraflow-qa deployment/postgres-landregistry -- psql -U postgres -d terraflow_landregistry_qa -c "TRUNCATE TABLE land_titles, attachments CASCADE;" 2>/dev/null || true
kubectl exec -n terraflow-qa deployment/postgres-users -- psql -U postgres -d terraflow_users_qa -c "TRUNCATE TABLE users CASCADE;" 2>/dev/null || true
kubectl exec -n terraflow-qa deployment/postgres-payments -- psql -U postgres -d terraflow_payments_qa -c "TRUNCATE TABLE payments CASCADE;" 2>/dev/null || true
echo "✅ QA databases cleaned"
echo ""

# Step 2: Run Playwright E2E tests
echo "🎭 Running Playwright E2E tests on QA..."
node playwright/automate-registration-qa.js

# Step 3: Generate BDD report
echo ""
echo "📊 Generating BDD report..."
npm run bdd:report
