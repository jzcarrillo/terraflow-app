#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_GATEWAY_URL="http://localhost:30081"

echo -e "\033[0;36m=== Manual User Creation ===\033[0m"

# Manual user data - EDIT THESE VALUES
USER_DATA=$(cat <<EOF
{
    "email_address": "jzcarrillo@gmail.com",
    "username": "jzcarrillo",
    "password": "carri600",
    "confirm_password": "carri600",
    "first_name": "John Christopher",
    "last_name": "Carrillo",
    "location": "Manila, Philippines",
    "role": "ADMIN"
}
EOF
)

echo -e "\033[0;37mUser Data to Create:\033[0m"
echo -e "\033[0;90m$USER_DATA\033[0m"

echo -e "\n\033[0;33mStep 1: Generating JWT token...\033[0m"
TOKEN=$(node "$SCRIPT_DIR/generate-long-token.js" 2>/dev/null | tr -d '[:space:]')
if [ -z "$TOKEN" ]; then
    echo -e "\033[0;31mFailed to generate token, using fallback...\033[0m"
    TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
else
    echo -e "\033[0;32mLong-lived JWT token generated successfully\033[0m"
fi

echo -e "\n\033[0;33mStep 2: Validating user data...\033[0m"
USERNAME=$(echo "$USER_DATA" | jq -r '.username')
EMAIL=$(echo "$USER_DATA" | jq -r '.email_address')

VALIDATE=$(curl -s -X GET "$API_GATEWAY_URL/api/users/validate?username=$USERNAME&email_address=$EMAIL" \
    -H "Content-Type: application/json")

if [ $? -eq 0 ]; then
    echo -e "\033[0;32mValidation Passed\033[0m"
else
    echo -e "\033[0;31mValidation Failed\033[0m"
    exit 1
fi

echo -e "\n\033[0;33mStep 3: Creating user...\033[0m"
CREATE=$(curl -s -X POST "$API_GATEWAY_URL/api/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$USER_DATA")

if [ $? -eq 0 ]; then
    echo -e "\033[0;32mUser Creation Successful!\033[0m"
    echo "$CREATE" | jq -r '"Message: \(.message)\nTransaction ID: \(.transaction_id)\nStatus: \(.status)"'
    
    echo -e "\n\033[0;33mWaiting 3 seconds for user processing...\033[0m"
    sleep 3
    echo -e "\033[0;36mUser should now be available in the system!\033[0m"
else
    echo -e "\033[0;31mUser Creation Failed\033[0m"
fi

echo -e "\n\033[0;36m=== Manual User Creation Completed! ===\033[0m"
