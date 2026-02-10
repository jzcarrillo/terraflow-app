#!/bin/bash

echo "🔌 Setting up QA Database Port Forwarding for pgAdmin4..."
echo ""
echo "Database Credentials:"
echo "  Username: postgres"
echo "  Password: password"
echo ""
echo "Databases:"
echo "  - terraflow_landregistry_qa (localhost:25432)"
echo "  - terraflow_documents_qa     (localhost:25433)"
echo "  - terraflow_users_qa         (localhost:25434)"
echo "  - terraflow_payments_qa      (localhost:25435)"
echo ""
echo "Press Ctrl+C to stop all port forwards"
echo ""

# Kill existing port forwards
pkill -f "kubectl port-forward.*terraflow-qa" 2>/dev/null

# Start port forwarding in background
kubectl port-forward -n terraflow-qa svc/postgres-landregistry-service 25432:5432 &
PID1=$!

kubectl port-forward -n terraflow-qa svc/postgres-documents-service 25433:5433 &
PID2=$!

kubectl port-forward -n terraflow-qa svc/postgres-users-service 25434:5434 &
PID3=$!

kubectl port-forward -n terraflow-qa svc/postgres-payments-service 25435:5435 &
PID4=$!

# Wait for port forwards to be ready
sleep 2

echo "✅ Port forwarding active!"
echo ""
echo "pgAdmin4 Connection Settings:"
echo "  Host: localhost"
echo "  Port: 25432 (landregistry) | 25433 (documents) | 25434 (users) | 25435 (payments)"
echo "  Username: postgres"
echo "  Password: password"
echo ""

# Trap Ctrl+C to cleanup
trap "echo ''; echo '🛑 Stopping port forwards...'; kill $PID1 $PID2 $PID3 $PID4 2>/dev/null; exit" INT

# Keep script running
wait
