#!/bin/bash
set -e

echo "🔧 Creating PROD databases..."

# Create terraflow_landregistry_prod
kubectl exec -n terraflow-prod $(kubectl get pods -n terraflow-prod -l app=postgres-landregistry -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_landregistry_prod;" || echo "terraflow_landregistry_prod already exists"

# Create terraflow_documents_prod
kubectl exec -n terraflow-prod $(kubectl get pods -n terraflow-prod -l app=postgres-documents -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_documents_prod;" || echo "terraflow_documents_prod already exists"

# Create terraflow_users_prod
kubectl exec -n terraflow-prod $(kubectl get pods -n terraflow-prod -l app=postgres-users -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_users_prod;" || echo "terraflow_users_prod already exists"

# Create terraflow_payments_prod
kubectl exec -n terraflow-prod $(kubectl get pods -n terraflow-prod -l app=postgres-payments -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_payments_prod;" || echo "terraflow_payments_prod already exists"

echo "✅ PROD databases created successfully!"
