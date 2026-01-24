#!/bin/bash

ID=${1:-100}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\033[0;33mGenerating fresh JWT token...\033[0m"
TOKEN=$(node "$SCRIPT_DIR/generate-long-token.js" 2>/dev/null | tr -d '[:space:]')

if [ -z "$TOKEN" ]; then
    echo -e "\033[0;31mFailed to extract token!\033[0m"
    exit 1
fi

echo -e "\033[0;32mUsing token: ${TOKEN:0:20}...\033[0m"

echo -e "\n\033[0;36m=== GET LAND TITLE BY ID TEST ===\033[0m"
echo -e "\033[0;33mTesting with ID: $ID\033[0m"

echo -e "\n\033[0;33mTesting GET Land Title by ID ($ID)...\033[0m"
RESPONSE=$(curl -s -X GET "http://localhost:30081/api/land-titles/$ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

if [ $? -eq 0 ]; then
    echo -e "\033[0;32mSUCCESS: GET Land Title by ID\033[0m"
    echo "$RESPONSE" | jq -r '.message, .source'
    echo -e "\n\033[0;33mLand Title Details:\033[0m"
    echo "$RESPONSE" | jq -r '.data | "  ID: \(.id)\n  Title Number: \(.title_number)\n  Owner: \(.owner_name)\n  Contact: \(.contact_no)\n  Address: \(.address)\n  Property Location: \(.property_location)\n  Area Size: \(.area_size)\n  Classification: \(.classification)\n  Status: \(.status)\n  Created: \(.created_at)"'
else
    echo -e "\033[0;31mFAILED: GET Land Title by ID\033[0m"
fi

echo -e "\n\033[0;33mTesting Redis Caching (calling same ID again)...\033[0m"
CACHED=$(curl -s -X GET "http://localhost:30081/api/land-titles/$ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

SOURCE=$(echo "$CACHED" | jq -r '.source')
if [ "$SOURCE" = "redis" ]; then
    echo -e "\033[0;35mCACHE HIT! Data served from Redis\033[0m"
else
    echo -e "\033[0;34mCACHE MISS! Data served from Database\033[0m"
fi

echo -e "\n\033[0;36m=== TEST COMPLETED ===\033[0m"
