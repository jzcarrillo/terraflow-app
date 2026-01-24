#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_GATEWAY_URL="http://localhost:30081"

echo -e "\033[0;36m=== Testing User Service - Creating 10 New Users ===\033[0m"

FIRST_NAMES=("John" "Jane" "Mike" "Sarah" "David" "Lisa" "Mark" "Anna" "Paul" "Emma")
LAST_NAMES=("Doe" "Smith" "Johnson" "Brown" "Davis" "Wilson" "Garcia" "Miller" "Taylor" "Anderson")
LOCATIONS=("Manila" "Cebu" "Davao" "Quezon City" "Makati" "Taguig" "Pasig" "Caloocan" "Las Pinas" "Antipolo")

echo -e "\n\033[0;33m0. Generating JWT token for authentication...\033[0m"

TOKEN=$(node "$SCRIPT_DIR/generate-long-token.js" 2>/dev/null | tr -d '[:space:]')
if [ -z "$TOKEN" ]; then
    echo -e "\033[0;33m⚠️ Token generation failed, using fallback token\033[0m"
    TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
else
    echo -e "\033[0;32m✅ Long-lived JWT token generated successfully\033[0m"
fi

for i in {1..10}; do
    echo -e "\n\033[0;33m=== Creating User $i/10 ===\033[0m"
    
    RANDOM_ID=$RANDOM
    FIRST_NAME="${FIRST_NAMES[$RANDOM % ${#FIRST_NAMES[@]}]}"
    LAST_NAME="${LAST_NAMES[$RANDOM % ${#LAST_NAMES[@]}]}"
    LOCATION="${LOCATIONS[$RANDOM % ${#LOCATIONS[@]}]}, Philippines"
    
    USER_DATA=$(cat <<EOF
{
    "email_address": "user$RANDOM_ID@example.com",
    "username": "user$RANDOM_ID",
    "password": "password123",
    "confirm_password": "password123",
    "first_name": "$FIRST_NAME",
    "last_name": "$LAST_NAME",
    "location": "$LOCATION"
}
EOF
)
    
    echo -e "\033[0;37mUser Data: $USER_DATA\033[0m"
    
    USERNAME=$(echo "$USER_DATA" | jq -r '.username')
    EMAIL=$(echo "$USER_DATA" | jq -r '.email_address')
    
    echo -e "\033[0;90mStep 1: Validating user data...\033[0m"
    VALIDATE=$(curl -s -X GET "$API_GATEWAY_URL/api/users/validate?username=$USERNAME&email_address=$EMAIL" \
        -H "Content-Type: application/json")
    
    if [ $? -eq 0 ]; then
        echo -e "\033[0;32mValidation Passed\033[0m"
    else
        echo -e "\033[0;31mValidation Failed\033[0m"
        continue
    fi
    
    echo -e "\033[0;90mStep 2: Creating user...\033[0m"
    CREATE=$(curl -s -X POST "$API_GATEWAY_URL/api/users" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$USER_DATA")
    
    if [ $? -eq 0 ]; then
        echo -e "\033[0;32mUser Creation Initiated\033[0m"
        echo "$CREATE" | jq -r '.message, .transaction_id'
    else
        echo -e "\033[0;31mUser Creation Failed\033[0m"
    fi
    
    sleep 2
done

echo -e "\n\033[0;36m=== All 10 Users Created! ===\033[0m"
