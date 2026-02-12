#!/bin/bash
set -e

echo "🔧 Creating UAT databases..."

# Create terraflow_landregistry_uat
kubectl exec -n terraflow-uat $(kubectl get pods -n terraflow-uat -l app=postgres-landregistry -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_landregistry_uat;" || echo "terraflow_landregistry_uat already exists"

# Create terraflow_documents_uat
kubectl exec -n terraflow-uat $(kubectl get pods -n terraflow-uat -l app=postgres-documents -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_documents_uat;" || echo "terraflow_documents_uat already exists"

# Create terraflow_users_uat
kubectl exec -n terraflow-uat $(kubectl get pods -n terraflow-uat -l app=postgres-users -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_users_uat;" || echo "terraflow_users_uat already exists"

# Create terraflow_payments_uat
kubectl exec -n terraflow-uat $(kubectl get pods -n terraflow-uat -l app=postgres-payments -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_payments_uat;" || echo "terraflow_payments_uat already exists"

echo "✅ UAT databases created successfully!"
