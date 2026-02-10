#!/bin/bash

echo "🔌 Setting up PROD Database Port Forwarding for pgAdmin4..."
echo ""
echo "Database Credentials:"
echo "  Username: postgres"
echo "  Password: password"
echo ""
echo "Databases:"
echo "  - terraflow_landregistry_prod (localhost:45432)"
echo "  - terraflow_documents_prod     (localhost:45433)"
echo "  - terraflow_users_prod         (localhost:45434)"
echo "  - terraflow_payments_prod      (localhost:45435)"
echo ""
echo "Press Ctrl+C to stop all port forwards"
echo ""

# Kill existing port forwards
pkill -f "kubectl port-forward.*terraflow-prod" 2>/dev/null

# Start port forwarding in background
kubectl port-forward -n terraflow-prod svc/postgres-landregistry-service 45432:5432 &
PID1=$!

kubectl port-forward -n terraflow-prod svc/postgres-documents-service 45433:5433 &
PID2=$!

kubectl port-forward -n terraflow-prod svc/postgres-users-service 45434:5434 &
PID3=$!

kubectl port-forward -n terraflow-prod svc/postgres-payments-service 45435:5435 &
PID4=$!

# Wait for port forwards to be ready
sleep 2

echo "✅ Port forwarding active!"
echo ""
echo "pgAdmin4 Connection Settings:"
echo "  Host: localhost"
echo "  Port: 45432 (landregistry) | 45433 (documents) | 45434 (users) | 45435 (payments)"
echo "  Username: postgres"
echo "  Password: password"
echo ""

# Trap Ctrl+C to cleanup
trap "echo ''; echo '🛑 Stopping port forwards...'; kill $PID1 $PID2 $PID3 $PID4 2>/dev/null; exit" INT

# Keep script running
wait
