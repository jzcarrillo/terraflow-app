#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_GATEWAY_URL="http://localhost:30081"

echo -e "\033[0;36m=== Get All Payments Test ===\033[0m"

TOKEN=$(node "$SCRIPT_DIR/generate-long-token.js" 2>/dev/null | tr -d '[:space:]')
if [ -z "$TOKEN" ]; then
    TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
else
    echo -e "\033[0;32mToken generated successfully\033[0m"
fi

echo -e "\n\033[0;33mGetting all payments...\033[0m"
RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/api/payments" \
    -H "Authorization: Bearer $TOKEN")

if [ $? -eq 0 ]; then
    COUNT=$(echo "$RESPONSE" | jq '. | length')
    echo -e "\033[0;32mSuccess: Retrieved $COUNT payments\033[0m"
    
    if [ "$COUNT" -gt 0 ]; then
        echo -e "\n\033[0;90mPayment List:\033[0m"
        echo "$RESPONSE" | jq -r '.[] | "  ID: \(.id) | Payment ID: \(.payment_id) | Amount: \(.amount) | Status: \(.status)"'
    fi
else
    echo -e "\033[0;31mFailed\033[0m"
fi

echo -e "\n\033[0;36m=== Get All Payments Completed ===\033[0m"
