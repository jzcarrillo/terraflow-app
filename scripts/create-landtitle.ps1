$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk4Nzk0OCwiaWF0IjoxNzU4OTAxNTQ4fQ.2hz3shbc0LVOvFhfWYTz22yVaUFAoMjcEOR4k6BcQHU"
}

$body = @{
    owner_name = "Tingogski"
    contact_no = "09178248312"
    title_number = "LT-20251-1111231"
    address = "123 Main St, Kesom Prabins"
    property_location = "Pasay City"
    lot_number = 123
    survey_number = "SV-0034"
    area_size = 1100.5
    classification = "Commercial"
    registration_date = "2024-01-15T00:00:00.000Z"
    registrar_office = "Registry of Deeds - Pasay"
    previous_title_number = "LT-2023-0999"
    encumbrances = "None"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:30081/api/land-titles" -Method POST -Headers $headers -Body $body









































