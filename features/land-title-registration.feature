Feature: Land Title Registration
  As a land owner
  I want to register my land title
  So that I can have a verified and blockchain-recorded property ownership

  Background:
    Given the Terraflow system is running
    And the user is authenticated

  Scenario: Successful land title registration with payment
    Given I have valid land title information
      | field              | value                    |
      | title_number       | TCT-2024-001            |
      | owner_name         | Juan Dela Cruz          |
      | contact_no         | 09123456789             |
      | email_address      | juan@example.com        |
      | address            | Manila, Philippines     |
      | property_location  | Quezon City             |
      | lot_number         | 123                     |
      | area               | 500                     |
    And I have uploaded required documents
      | document_type | file_name        |
      | DEED          | deed.pdf         |
      | TAX_DECLARATION | tax_dec.pdf   |
    When I submit the land title registration
    Then the land title should be created with status "PENDING"
    And a transaction ID should be generated
    And documents should be uploaded to document service
    When I complete the payment
    Then the payment status should be "PAID"
    And the land title status should change to "ACTIVE"
    And the land title should be recorded on blockchain
    And a blockchain hash should be stored

  Scenario: Land title registration without documents
    Given I have valid land title information
      | field              | value                    |
      | title_number       | TCT-2024-002            |
      | owner_name         | Maria Santos            |
      | property_location  | Makati City             |
    But I have not uploaded any documents
    When I submit the land title registration
    Then the land title registration should fail
    And I should see error message "No attachments provided"

  Scenario: Duplicate land title registration
    Given a land title already exists with title number "TCT-2024-003"
    When I try to register a land title with the same title number "TCT-2024-003"
    Then the land title registration should fail
    And I should see error message "Land title already exists"

  Scenario: Payment cancellation and rollback
    Given I have a land title with status "PENDING"
      | title_number | TCT-2024-004 |
    And I have created a payment
    When I cancel the payment
    Then the payment status should be "CANCELLED"
    And the land title should remain "PENDING"
    And no blockchain recording should occur

  Scenario: Payment confirmation triggers blockchain recording
    Given I have a land title with status "PENDING"
      | title_number | TCT-2024-005 |
    And I have created a payment
    When the payment is confirmed as "PAID"
    Then the land title status should change to "ACTIVE"
    And the blockchain service should be called
    And the blockchain hash should be stored in database
    And a success event should be sent to payment service

  Scenario: Blockchain failure triggers rollback
    Given I have a land title with status "PENDING"
      | title_number | TCT-2024-006 |
    And I have created a payment
    And the blockchain service is down
    When the payment is confirmed as "PAID"
    Then the land title status should change to "ACTIVE" temporarily
    But the blockchain recording should fail
    And the land title status should rollback to "PENDING"
    And a rollback event should be sent to payment service
    And the payment should be marked as "FAILED"

  Scenario: Retrieve land title by title number
    Given a land title exists with title number "TCT-2024-007"
    When I search for land title "TCT-2024-007"
    Then I should see the land title details
    And the status should be displayed
    And the blockchain hash should be displayed if available

  Scenario: List all land titles
    Given multiple land titles exist in the system
      | title_number | owner_name     | status  |
      | TCT-2024-008 | Pedro Garcia   | ACTIVE  |
      | TCT-2024-009 | Ana Lopez      | PENDING |
      | TCT-2024-010 | Carlos Reyes   | ACTIVE  |
    When I request all land titles
    Then I should see a list of 3 land titles
    And the list should be ordered by creation date

  Scenario: Payment reactivation after cancellation
    Given I have a land title with status "ACTIVE"
      | title_number | TCT-2024-011 |
    And the land title has a blockchain hash
    When the payment is cancelled
    Then the land title status should change to "PENDING"
    And a cancellation hash should be recorded on blockchain
    When the payment is reactivated
    Then the land title status should change back to "ACTIVE"
    And a reactivation hash should be recorded on blockchain
    And all three hashes should be stored (original, cancellation, reactivation)
