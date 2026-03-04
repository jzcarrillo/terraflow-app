Feature: Mortgage Creation
  As a bank user
  I want to create mortgages on land titles
  So that I can secure loans with property collateral

  Background:
    Given the following land titles exist:
      | id  | title_number | owner_name    | status | appraised_value |
      | 1   | TCT-12345    | Juan Dela Cruz| ACTIVE | 10000000        |
      | 2   | TCT-67890    | Maria Santos  | ACTIVE | 5000000         |
      | 3   | TCT-11111    | Pedro Garcia  | PENDING| 8000000         |
    And I am logged in as a bank user with id 100

  Scenario: Successfully create a mortgage on an ACTIVE land title
    Given land title "TCT-12345" has status "ACTIVE"
    When I create a mortgage with the following details:
      | land_title_id | 1                |
      | bank_name     | BDO              |
      | bank_user_id  | 100              |
      | amount        | 5000000          |
      | interest_rate | 5.5              |
      | term_years    | 10               |
      | owner_name    | Juan Dela Cruz   |
    Then the mortgage should be created successfully
    And the mortgage status should be "PENDING"
    And the mortgage lien_position should be 1

  Scenario: Cannot create mortgage on PENDING land title
    Given land title "TCT-11111" has status "PENDING"
    When I attempt to create a mortgage on land title "TCT-11111"
    Then the mortgage creation should fail
    And I should see error "Only ACTIVE land titles can be mortgaged"

  Scenario: Owner name must match land title owner
    Given land title "TCT-12345" has owner "Juan Dela Cruz"
    When I create a mortgage with owner_name "Wrong Owner"
    Then the mortgage creation should fail
    And I should see error "Owner name does not match land title owner"

  Scenario: Mortgage amount cannot exceed appraised value
    Given land title "TCT-12345" has appraised_value 10000000
    When I create a mortgage with amount 15000000
    Then the mortgage creation should fail
    And I should see error "Mortgage amount exceeds appraised value"

  Scenario: Maximum 3 active mortgages per land title
    Given land title "TCT-12345" has 3 ACTIVE mortgages
    When I attempt to create a 4th mortgage
    Then the mortgage creation should fail
    And I should see error "Maximum 3 active mortgages reached. Cannot create new mortgage."

  Scenario: Auto-assign lien position based on existing mortgages
    Given land title "TCT-12345" has 2 ACTIVE mortgages
    When I create a new mortgage on land title "TCT-12345"
    Then the new mortgage lien_position should be 3

  Scenario: Upload documents with mortgage creation
    When I create a mortgage with attachments:
      | filename        | type        |
      | deed.pdf        | application/pdf |
      | contract.pdf    | application/pdf |
    Then the mortgage should be created successfully
    And the documents should be queued for upload
    And the documents should be linked to the mortgage_id

  Scenario: Land title dropdown shows only ACTIVE titles
    When I request the land titles dropdown for mortgage
    Then I should see only land titles with status "ACTIVE"
    And I should see "TCT-12345" in the dropdown
    And I should see "TCT-67890" in the dropdown
    And I should not see "TCT-11111" in the dropdown

  Scenario: Cannot transfer land title with PENDING mortgage
    Given land title "TCT-12345" has a PENDING mortgage
    When I check transfer eligibility for land title "TCT-12345"
    Then the land title should not be eligible for transfer
    And I should see "PENDING or ACTIVE mortgages block transfer"

  Scenario: Cannot transfer land title with ACTIVE mortgage
    Given land title "TCT-12345" has an ACTIVE mortgage
    When I check transfer eligibility for land title "TCT-12345"
    Then the land title should not be eligible for transfer

  Scenario: Can transfer land title with RELEASED mortgage
    Given land title "TCT-12345" has a RELEASED mortgage
    When I check transfer eligibility for land title "TCT-12345"
    Then the land title should be eligible for transfer
