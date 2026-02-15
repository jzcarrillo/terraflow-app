#!/bin/bash

echo "Creating local dev databases (no suffix)..."

# Database credentials
DB_USER="postgres"
DB_PASSWORD="password"
NAMESPACE="terraflow-app"

# Create databases for each service
DATABASES=("terraflow_landregistry" "terraflow_documents" "terraflow_users" "terraflow_payments")
SERVICES=("postgres-landregistry-service" "postgres-documents-service" "postgres-users-service" "postgres-payments-service")

for i in "${!DATABASES[@]}"; do
  DB_NAME="${DATABASES[$i]}"
  SERVICE="${SERVICES[$i]}"
  
  echo "Creating database: $DB_NAME on $SERVICE..."
  
  kubectl exec -n $NAMESPACE deployment/$(echo $SERVICE | sed 's/-service//') -- psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME already exists or creation failed"
done

echo "✅ Local dev databases created successfully"
