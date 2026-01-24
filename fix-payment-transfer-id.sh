#!/bin/bash

echo "🔍 Getting transfer_id from landregistry database..."
TRANSFER_ID=$(kubectl exec -n terraflow-app deployment/postgres-landregistry -- psql -U postgres -d landregistry -t -c "SELECT transfer_id FROM land_transfers WHERE title_number = 'LT-2025-100408-2';" | xargs)

if [ -z "$TRANSFER_ID" ]; then
    echo "❌ No transfer found for LT-2025-100408-2"
    exit 1
fi

echo "✅ Found transfer_id: $TRANSFER_ID"

echo "🔄 Updating payment with transfer_id..."
kubectl exec -n terraflow-app deployment/postgres-payments -- psql -U postgres -d payments -c "UPDATE payments SET transfer_id = '$TRANSFER_ID' WHERE reference_id = 'LT-2025-100408-2' AND reference_type = 'Transfer Title';"

echo "✅ Verifying update..."
kubectl exec -n terraflow-app deployment/postgres-payments -- psql -U postgres -d payments -c "SELECT payment_id, reference_id, reference_type, transfer_id, status FROM payments WHERE reference_id = 'LT-2025-100408-2';"

echo "✅ Done! You can now confirm the payment."
