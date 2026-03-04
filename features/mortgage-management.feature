Feature: Mortgage Management
  As a bank user
  I want to manage mortgages (edit, cancel)
  So that I can maintain accurate mortgage records

  Background:
    Given the following mortgages exist:
      | id | land_title_id | bank_name | amount  | interest_rate | term_years | status   | owner_name     |
      | 1  | 1             | BDO       | 5000000 | 5.5           | 10         | PENDING  | Juan Dela Cruz |
      | 2  | 1             | BPI       | 3000000 | 6.0           | 5          | ACTIVE   | Juan Dela Cruz |
      | 3  | 2             | Metrobank | 2000000 | 7.0           | 15         | RELEASED | Maria Santos   |
    And I am logged in as a bank user with id 100

  # Edit Mortgage Scenarios
  Scenario: Edit PENDING mortgage details
    Given mortgage id 1 has status "PENDING"
    When I update mortgage id 1 with:
      | amount        | 6000000 |
      | interest_rate | 6.0     |
      | term_years    | 12      |
      | bank_name     | BDO Unibank |
    Then the mortgage should be updated successfully
    And the mortgage amount should be 6000000
    And the mortgage interest_rate should be 6.0
    And the mortgage term_years should be 12
    And the mortgage bank_name should be "BDO Unibank"

  Scenario: Edit ACTIVE mortgage details (limited fields)
    Given mortgage id 2 has status "ACTIVE"
    When I update mortgage id 2 with:
      | amount        | 3500000 |
      | interest_rate | 6.5     |
    Then the mortgage should be updated successfully
    And the mortgage amount should be 3500000
    And the mortgage interest_rate should be 6.5

  Scenario: Cannot edit land_title_id when ACTIVE
    Given mortgage id 2 has status "ACTIVE"
    When I attempt to update land_title_id to 2
    Then the update should fail
    And I should see error "Cannot change land_title_id for ACTIVE mortgage"

  Scenario: Cannot edit RELEASED mortgage
    Given mortgage id 3 has status "RELEASED"
    When I attempt to update mortgage id 3
    Then the update should fail
    And I should see error "Cannot edit RELEASED mortgage"

  # Cancel Mortgage Scenarios
  Scenario: Cancel PENDING mortgage
    Given mortgage id 1 has status "PENDING"
    When I cancel mortgage id 1
    Then the mortgage status should be "CANCELLED"
    And the cancel button should be disabled

  Scenario: Cannot cancel ACTIVE mortgage
    Given mortgage id 2 has status "ACTIVE"
    When I attempt to cancel mortgage id 2
    Then the cancellation should fail
    And I should see error "Cannot cancel ACTIVE mortgage"
    And the cancel button should be disabled

  Scenario: Cannot cancel RELEASED mortgage
    Given mortgage id 3 has status "RELEASED"
    When I attempt to cancel mortgage id 3
    Then the cancellation should fail
    And the cancel button should be disabled

  # UI Button States
  Scenario: Cancel button enabled for PENDING mortgage
    Given mortgage id 1 has status "PENDING"
    When I view mortgage id 1 details
    Then the cancel button should be enabled
    And the edit button should be enabled

  Scenario: Cancel button disabled for ACTIVE mortgage
    Given mortgage id 2 has status "ACTIVE"
    When I view mortgage id 2 details
    Then the cancel button should be disabled
    And the edit button should be enabled

  Scenario: Both buttons disabled for RELEASED mortgage
    Given mortgage id 3 has status "RELEASED"
    When I view mortgage id 3 details
    Then the cancel button should be disabled
    And the edit button should be disabled

  # Validation Scenarios
  Scenario: No fields to update returns current mortgage
    Given mortgage id 1 has status "PENDING"
    When I update mortgage id 1 with no fields
    Then the mortgage should remain unchanged
    And I should receive the current mortgage data

  Scenario: Mortgage not found error
    When I attempt to update mortgage id 999
    Then the update should fail
    And I should see error "Mortgage not found"

  Scenario: Mortgage not found on cancel
    When I attempt to cancel mortgage id 999
    Then the cancellation should fail
    And I should see error "Mortgage not found"
