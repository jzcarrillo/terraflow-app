#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\033[0;33mStep 1: Generating long-lived JWT token...\033[0m"

TOKEN=$(node "$SCRIPT_DIR/generate-long-token.js" 2>/dev/null | tr -d '[:space:]')
if [ -z "$TOKEN" ]; then
    echo -e "\033[0;31mFailed to generate JWT token, using fallback...\033[0m"
    TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MDY3NTAwNiwiZXhwIjoxNzYwNzYxNDA2fQ.U_97iZC2tdG6tf0h_t7X_XtdSgos-aA5LD4iCbz64gU"
else
    echo -e "\033[0;32mLong-lived JWT token generated successfully!\033[0m"
fi

SAMPLE_PDF="JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovRmlsdGVyIC9GbGF0ZURlY29kZQo+PgpzdHJlYW0KeJzLSM3PyckBAAAGXAJYCmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKNQplbmRvYmoKCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDQgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzUgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKCjUgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCA0IDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgMiAwIFIKPj4KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAxNDkgMDAwMDAgbiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDc0IDAwMDAwIG4gCjAwMDAwMDAxOTMgMDAwMDAgbiAKMDAwMDAwMDI1MCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjM0OQolJUVPRg=="

TEMP_DIR=$(mktemp -d)
echo -e "\033[0;32mStep 2: Created temp directory: $TEMP_DIR\033[0m"

OWNERS=("Juan Dela Cruz" "Maria Santos" "Jose Rizal" "Ana Garcia" "Pedro Martinez")
CITIES=("Manila" "Quezon City" "Makati" "Pasig" "Taguig")
CLASSIFICATIONS=("Residential" "Commercial" "Industrial" "Agricultural")
REGISTRARS=("Registry of Deeds - Manila" "Registry of Deeds - Quezon City")

echo -e "\n\033[0;36mStep 3: === CREATING 2 LAND TITLES WITH ATTACHMENTS ===\033[0m"

SUCCESS=0
FAIL=0

for i in {1..2}; do
    OWNER="${OWNERS[$RANDOM % ${#OWNERS[@]}]}"
    CITY="${CITIES[$RANDOM % ${#CITIES[@]}]}"
    CLASSIFICATION="${CLASSIFICATIONS[$RANDOM % ${#CLASSIFICATIONS[@]}]}"
    REGISTRAR="${REGISTRARS[$RANDOM % ${#REGISTRARS[@]}]}"
    
    TITLE_NUMBER="LT-2025-$((RANDOM % 900000 + 100000))-$i"
    LOT_NUMBER=$((RANDOM % 9999))
    SURVEY_NUMBER="SV-$((RANDOM % 9000 + 1000))"
    AREA_SIZE=$(awk -v min=50 -v max=5000 'BEGIN{srand(); print min+rand()*(max-min)}')
    CONTACT_NO="091$((RANDOM % 90000000 + 10000000))"
    
    TITLE_DEED="$TEMP_DIR/title_deed_$i.pdf"
    SURVEY_PLAN="$TEMP_DIR/survey_plan_$i.pdf"
    TAX_DECLARATION="$TEMP_DIR/tax_declaration_$i.pdf"
    
    echo "$SAMPLE_PDF" | base64 -d > "$TITLE_DEED"
    echo "$SAMPLE_PDF" | base64 -d > "$SURVEY_PLAN"
    echo "$SAMPLE_PDF" | base64 -d > "$TAX_DECLARATION"
    
    echo -e "\033[0;33mCreating land title $i/2: $TITLE_NUMBER (with 3 attachments)\033[0m"
    
    RESPONSE=$(curl -s -X POST "http://localhost:30081/api/land-titles" \
        -H "Authorization: Bearer $TOKEN" \
        -F "owner_name=$OWNER $i" \
        -F "contact_no=$CONTACT_NO" \
        -F "email_address=$(echo $OWNER | tr '[:upper:]' '[:lower:]' | tr -d ' ')$i@example.com" \
        -F "title_number=$TITLE_NUMBER" \
        -F "address=$((RANDOM % 999 + 1)) Main Street, $CITY" \
        -F "property_location=$CITY" \
        -F "lot_number=$LOT_NUMBER" \
        -F "survey_number=$SURVEY_NUMBER" \
        -F "area_size=$AREA_SIZE" \
        -F "classification=$CLASSIFICATION" \
        -F "registration_date=2024-01-15T00:00:00.000Z" \
        -F "registrar_office=$REGISTRAR" \
        -F "previous_title_number=LT-2023-$((RANDOM % 9000 + 1000))" \
        -F "encumbrances=None" \
        -F "attachments=@$TITLE_DEED" \
        -F "attachments=@$SURVEY_PLAN" \
        -F "attachments=@$TAX_DECLARATION")
    
    if [ $? -eq 0 ]; then
        echo -e "\033[0;32mSUCCESS: $TITLE_NUMBER created with attachments\033[0m"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "\033[0;31mFAILED: Land title $i\033[0m"
        FAIL=$((FAIL + 1))
    fi
    
    sleep 0.5
done

echo -e "\n\033[0;33mStep 4: Cleaning up temporary files...\033[0m"
rm -rf "$TEMP_DIR"

echo -e "\n\033[0;36m=== BATCH CREATION COMPLETED ===\033[0m"
echo -e "\033[0;32mSUCCESS: $SUCCESS land titles created with attachments\033[0m"
echo -e "\033[0;31mFAILED: $FAIL land titles failed\033[0m"
echo -e "\033[0;37mTOTAL: 2 attempts\033[0m"
