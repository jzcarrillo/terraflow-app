#!/bin/bash

echo "🔌 Setting up Local/Dev Database Port Forwarding for pgAdmin4..."
echo ""
echo "Database Credentials:"
echo "  Username: postgres"
echo "  Password: password"
echo ""
echo "Databases:"
echo "  - terraflow_landregistry (localhost:15432)"
echo "  - terraflow_documents     (localhost:15433)"
echo "  - terraflow_users         (localhost:15434)"
echo "  - terraflow_payments      (localhost:15435)"
echo ""
echo "Press Ctrl+C to stop all port forwards"
echo ""

# Kill existing port forwards
pkill -f "kubectl port-forward.*terraflow-app" 2>/dev/null

# Start port forwarding in background
kubectl port-forward -n terraflow-app svc/postgres-landregistry-service 15432:5432 &
PID1=$!

kubectl port-forward -n terraflow-app svc/postgres-documents-service 15433:5433 &
PID2=$!

kubectl port-forward -n terraflow-app svc/postgres-users-service 15434:5434 &
PID3=$!

kubectl port-forward -n terraflow-app svc/postgres-payments-service 15435:5435 &
PID4=$!

# Wait for port forwards to be ready
sleep 2

echo "✅ Port forwarding active!"
echo ""
echo "pgAdmin4 Connection Settings:"
echo "  Host: localhost"
echo "  Port: 15432 (landregistry) | 15433 (documents) | 15434 (users) | 15435 (payments)"
echo "  Username: postgres"
echo "  Password: password"
echo ""

# Trap Ctrl+C to cleanup
trap "echo ''; echo '🛑 Stopping port forwards...'; kill $PID1 $PID2 $PID3 $PID4 2>/dev/null; exit" INT

# Keep script running
wait
