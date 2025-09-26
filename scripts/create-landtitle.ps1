$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODk2OTk1MCwiaWF0IjoxNzU4ODgzNTUwfQ.s7MahoiLLQObp_1pYubnFfSqu4I4_wuBG-WFO8FTZ4o"
}

$body = @{
    owner_name = "Solid Pa-North"
    contact_no = "09178248312"
    title_number = "LT-2024-11231"
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













