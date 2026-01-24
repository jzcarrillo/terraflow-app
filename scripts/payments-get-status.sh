#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_GATEWAY_URL="http://localhost:30081"

echo -e "\033[0;36m=== Get Payment Status Test ===\033[0m"

TOKEN=$(node "$SCRIPT_DIR/generate-long-token.js" 2>/dev/null | tr -d '[:space:]')
if [ -z "$TOKEN" ]; then
    TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
else
    echo -e "\033[0;32mToken generated successfully\033[0m"
fi

PAYMENT_ID=4

echo -e "\n\033[0;33mGetting status for payment ID: $PAYMENT_ID\033[0m"
RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/api/payments/$PAYMENT_ID/status" \
    -H "Authorization: Bearer $TOKEN")

if [ $? -eq 0 ]; then
    echo -e "\033[0;32mSuccess: Status retrieved\033[0m"
    STATUS=$(echo "$RESPONSE" | jq -r '.status')
    echo "$RESPONSE" | jq -r '"Payment Status: \(.status)\nMessage: \(.message)"'
    
    case $STATUS in
        "PENDING") echo -e "\033[0;33mStatus Description: Payment is awaiting confirmation\033[0m" ;;
        "PAID") echo -e "\033[0;32mStatus Description: Payment has been confirmed and processed\033[0m" ;;
        "CANCELLED") echo -e "\033[0;31mStatus Description: Payment has been cancelled\033[0m" ;;
        "FAILED") echo -e "\033[0;31mStatus Description: Payment processing failed\033[0m" ;;
        *) echo -e "\033[0;90mStatus Description: Unknown status\033[0m" ;;
    esac
else
    echo -e "\033[0;31mFailed\033[0m"
fi

echo -e "\n\033[0;36m=== Get Payment Status Completed ===\033[0m"
