#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_GATEWAY_URL="http://localhost:30081"

echo -e "\033[0;36m=== Payment ID Validation Test ===\033[0m"

TOKEN=$(node "$SCRIPT_DIR/generate-long-token.js" 2>/dev/null | tr -d '[:space:]')
if [ -z "$TOKEN" ]; then
    TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
else
    echo -e "\033[0;32mToken generated successfully\033[0m"
fi

PAYMENT_ID="PAY-2025-17600755487841"

echo -e "\n\033[0;33mTesting Payment ID: $PAYMENT_ID\033[0m"
RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/api/payments/validate/id?payment_id=$PAYMENT_ID" \
    -H "Authorization: Bearer $TOKEN")

if [ $? -eq 0 ]; then
    echo "$RESPONSE" | jq -r '"Validation Result: \(.message)\nExists: \(.exists)"'
else
    echo -e "\033[0;31mValidation Failed\033[0m"
fi

echo -e "\n\033[0;36m=== Payment ID Validation Completed ===\033[0m"
