#!/bin/bash

echo "🔌 Setting up UAT Database Port Forwarding for pgAdmin4..."
echo ""
echo "Database Credentials:"
echo "  Username: postgres"
echo "  Password: password"
echo ""
echo "Databases:"
echo "  - terraflow_landregistry_uat (localhost:35432)"
echo "  - terraflow_documents_uat     (localhost:35433)"
echo "  - terraflow_users_uat         (localhost:35434)"
echo "  - terraflow_payments_uat      (localhost:35435)"
echo ""
echo "Press Ctrl+C to stop all port forwards"
echo ""

# Kill existing port forwards
pkill -f "kubectl port-forward.*terraflow-uat" 2>/dev/null

# Start port forwarding in background
kubectl port-forward -n terraflow-uat svc/postgres-landregistry-service 35432:5432 &
PID1=$!

kubectl port-forward -n terraflow-uat svc/postgres-documents-service 35433:5433 &
PID2=$!

kubectl port-forward -n terraflow-uat svc/postgres-users-service 35434:5434 &
PID3=$!

kubectl port-forward -n terraflow-uat svc/postgres-payments-service 35435:5435 &
PID4=$!

# Wait for port forwards to be ready
sleep 2

echo "✅ Port forwarding active!"
echo ""
echo "pgAdmin4 Connection Settings:"
echo "  Host: localhost"
echo "  Port: 35432 (landregistry) | 35433 (documents) | 35434 (users) | 35435 (payments)"
echo "  Username: postgres"
echo "  Password: password"
echo ""

# Trap Ctrl+C to cleanup
trap "echo ''; echo '🛑 Stopping port forwards...'; kill $PID1 $PID2 $PID3 $PID4 2>/dev/null; exit" INT

# Keep script running
wait
