#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\033[0;33mGenerating fresh JWT token...\033[0m"
TOKEN=$(node "$SCRIPT_DIR/generate-long-token.js" 2>/dev/null | tr -d '[:space:]')

if [ -z "$TOKEN" ]; then
    echo -e "\033[0;31mFailed to extract token!\033[0m"
    exit 1
fi

echo -e "\033[0;32mUsing token: ${TOKEN:0:20}...\033[0m"

echo -e "\n\033[0;36m=== GET ALL LAND TITLES TEST ===\033[0m"

echo -e "\n\033[0;33mTesting GET All Land Titles...\033[0m"
RESPONSE=$(curl -s -X GET "http://localhost:30081/api/land-titles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

if [ $? -eq 0 ]; then
    echo -e "\033[0;32mSUCCESS: GET All Land Titles\033[0m"
    echo "$RESPONSE" | jq -r '.message, .source, (.data | length)'
    echo "$RESPONSE" | jq -r '.data[] | "  ID: \(.id) | Title: \(.title_number) | Owner: \(.owner_name)"' | head -50
else
    echo -e "\033[0;31mFAILED: GET All Land Titles\033[0m"
fi

echo -e "\n\033[0;33mTesting Redis Caching (calling again)...\033[0m"
CACHED=$(curl -s -X GET "http://localhost:30081/api/land-titles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")

SOURCE=$(echo "$CACHED" | jq -r '.source')
if [ "$SOURCE" = "redis" ]; then
    echo -e "\033[0;35mCACHE HIT! Data served from Redis\033[0m"
else
    echo -e "\033[0;34mCACHE MISS! Data served from Database\033[0m"
fi

echo -e "\n\033[0;36m=== TEST COMPLETED ===\033[0m"
