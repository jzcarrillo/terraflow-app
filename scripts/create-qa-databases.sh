#!/bin/bash
set -e

echo "🔧 Creating QA databases..."

# Create terraflow_landregistry_qa
kubectl exec -n terraflow-qa $(kubectl get pods -n terraflow-qa -l app=postgres-landregistry -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_landregistry_qa;" || echo "terraflow_landregistry_qa already exists"

# Create terraflow_documents_qa
kubectl exec -n terraflow-qa $(kubectl get pods -n terraflow-qa -l app=postgres-documents -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_documents_qa;" || echo "terraflow_documents_qa already exists"

# Create terraflow_users_qa
kubectl exec -n terraflow-qa $(kubectl get pods -n terraflow-qa -l app=postgres-users -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_users_qa;" || echo "terraflow_users_qa already exists"

# Create terraflow_payments_qa
kubectl exec -n terraflow-qa $(kubectl get pods -n terraflow-qa -l app=postgres-payments -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "CREATE DATABASE terraflow_payments_qa;" || echo "terraflow_payments_qa already exists"

echo "✅ QA databases created successfully!"
