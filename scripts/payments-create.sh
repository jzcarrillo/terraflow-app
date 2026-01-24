#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_GATEWAY_URL="http://localhost:30081"

echo -e "\033[0;36m=== Create Payment Test ===\033[0m"

TOKEN=$(node "$SCRIPT_DIR/generate-long-token.js" 2>/dev/null | tr -d '[:space:]')
if [ -z "$TOKEN" ]; then
    TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
else
    echo -e "\033[0;32mToken generated successfully\033[0m"
fi

PAYMENT_DATA=$(cat <<EOF
{
    "land_title_id": "LT-2025-399474-1",
    "payer_name": "John Doe",
    "payment_method": "Credit Card",
    "amount": 15000.00,
    "description": "Land Title Registration Fee",
    "created_by": "Cashier 1"
}
EOF
)

echo -e "\n\033[0;90mPayment Data:\033[0m"
echo -e "\033[0;37m$PAYMENT_DATA\033[0m"

echo -e "\n\033[0;33mCreating payment...\033[0m"
RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/api/payments" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYMENT_DATA")

if [ $? -eq 0 ]; then
    echo -e "\033[0;32mSuccess: Payment created\033[0m"
    echo "$RESPONSE" | jq -r '"Message: \(.message)\nPayment ID: \(.payment_id)\nTransaction ID: \(.transaction_id)\nStatus: \(.status)"'
else
    echo -e "\033[0;31mFailed\033[0m"
fi

echo -e "\n\033[0;36m=== Create Payment Completed ===\033[0m"
