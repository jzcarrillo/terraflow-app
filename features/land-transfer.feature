Feature: Land Transfer Management
  As a land registry officer
  I want to manage land title transfers
  So that ownership can be transferred between parties

  Background:
    Given the Terraflow system is running
    And the user is authenticated

  Scenario: Create land transfer with ACTIVE land title
    Given a land title exists with status "ACTIVE"
      | field         | value              |
      | title_number  | LT-2024-001        |
      | owner_name    | Jose Rizal         |
      | contact       | 09123456789        |
      | email         | jose@example.com   |
      | address       | Manila             |
    When I create a land transfer with buyer details
      | field         | value              |
      | buyer_name    | Maria Santos       |
      | contact       | 09187654321        |
      | email         | maria@example.com  |
      | address       | Mandaluyong        |
    Then the land transfer should be created with status "PENDING"
    And the land title should remain "ACTIVE"

  Scenario: Cannot create land transfer with PENDING land title
    Given a land title exists with status "PENDING"
      | field         | value              |
      | title_number  | LT-2024-002        |
      | owner_name    | Jose Rizal         |
    When I try to create a land transfer
    Then I should see error message "Cannot transfer land title with PENDING status"
    And the land transfer should not be created

  Scenario: Cancel land transfer with PENDING status
    Given a land title exists with status "ACTIVE"
    And a land transfer exists with status "PENDING"
      | field         | value              |
      | buyer_name    | Maria Santos       |
      | contact       | 09187654321        |
    When I cancel the land transfer
    Then the land transfer status should change to "CANCELLED"
    And the land title should remain "ACTIVE"

  Scenario: Cannot cancel land transfer with COMPLETED status
    Given a land transfer exists with status "COMPLETED"
    When I try to cancel the land transfer
    Then I should see error message "Cannot cancel completed land transfer"

  Scenario: Update land transfer with PENDING status
    Given a land transfer exists with status "PENDING"
      | field         | value              |
      | buyer_name    | Maria Santos       |
      | contact       | 09187654321        |
    When I update the land transfer with new buyer details
      | field         | value              |
      | buyer_name    | Juan Dela Cruz     |
      | contact       | 09198765432        |
      | email         | juan@example.com   |
      | address       | Quezon City        |
    Then the land transfer should be updated successfully
    And the buyer details should reflect the new values

  Scenario: Cannot update land transfer with COMPLETED status
    Given a land transfer exists with status "COMPLETED"
    When I try to update the land transfer
    Then I should see error message "Cannot update completed land transfer"

  Scenario: Complete land transfer when payment is PAID
    Given a land title exists with status "ACTIVE"
      | field         | value              |
      | title_number  | LT-2024-003        |
      | owner_name    | Jose Rizal         |
      | contact       | 09123456789        |
      | email         | jose@example.com   |
      | address       | Manila             |
    And a land transfer exists with status "PENDING"
      | field         | value              |
      | buyer_name    | Maria Santos       |
      | contact       | 09187654321        |
      | email         | maria@example.com  |
      | address       | Mandaluyong        |
    When the transfer payment status changes to "PAID"
    Then the land transfer status should change to "COMPLETED"
    And the land title status should remain "ACTIVE"
    And the land title owner details should be updated
      | field         | value              |
      | owner_name    | Maria Santos       |
      | contact       | 09187654321        |
      | email         | maria@example.com  |
      | address       | Mandaluyong        |
    And the land title should have blockchain details
      | hash_type     |
      | Seller Hash   |
      | Buyer Hash    |
    And both seller and buyer hashes should be recorded on blockchain
