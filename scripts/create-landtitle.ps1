$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWQiOjEsImV4cCI6MTc1ODg1NDA5NywiaWF0IjoxNzU4NzY3Njk3fQ.98TgRFo_J4XZgmWo-6NI46s2K1kwvRXGN9Nwjr9OyAY"
}

$body = @{
    owner_name = "Solid Pa-North"
    contact_no = "09178248312"
    title_number = "LT-2024-1123"
    address = "123 Main St, Kesom Prabins"
    property_location = "Pasay City"
    lot_number = 123
    survey_number = "SV-0034"
    area_size = 1100.5
    classification = "Commercial"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:30081/api/land-titles" -Method POST -Headers $headers -Body $body






