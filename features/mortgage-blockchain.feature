Feature: Mortgage Blockchain Integration
  As a system
  I want to record mortgage transactions on blockchain
  So that mortgage records are immutable and auditable

  Background:
    Given the blockchain service is running
    And I am logged in as a bank user

  # Mortgage Activation Blockchain
  Scenario: Record mortgage activation on blockchain
    Given mortgage id 1 has status "PENDING"
    When the mortgage payment is confirmed
    Then a blockchain transaction should be submitted
    And the transaction should contain:
      | mortgage_id     | 1              |
      | land_title_id   | 1              |
      | bank_name       | BDO            |
      | amount          | 5000000        |
      | status          | ACTIVE         |
      | transaction_type| CreateMortgage |
    And a blockchain hash should be returned
    And the blockchain hash should be stored in mortgage.blockchain_hash

  Scenario: Blockchain failure on mortgage activation
    Given mortgage id 1 has status "PENDING"
    And the blockchain service is unavailable
    When the mortgage payment is confirmed
    Then the mortgage should still be activated
    And an error should be logged
    But the blockchain_hash should be null

  Scenario: Blockchain hash is unique per mortgage
    Given 2 mortgages are activated
    When I retrieve their blockchain hashes
    Then each mortgage should have a different blockchain_hash

  # Mortgage Release Blockchain
  Scenario: Record mortgage release on blockchain
    Given mortgage id 1 has status "ACTIVE"
    When the release payment is confirmed
    Then a release blockchain transaction should be submitted
    And the transaction should contain:
      | mortgage_id      | 1                |
      | land_title_id    | 1                |
      | previous_status  | ACTIVE           |
      | new_status       | RELEASED         |
      | transaction_type | ReleaseMortgage  |
    And a release blockchain hash should be returned
    And the release hash should be stored in mortgage.release_blockchain_hash

  # Blockchain Query Scenarios
  Scenario: Query mortgage blockchain history
    Given mortgage id 1 has been activated and released
    When I query the blockchain history for mortgage id 1
    Then I should see 2 blockchain transactions:
      | transaction_type     | hash              |
      | MORTGAGE_ACTIVATION  | activation_hash   |
      | MORTGAGE_RELEASE     | release_hash      |

  Scenario: Blockchain transaction includes timestamp
    Given mortgage id 1 is being activated
    When the blockchain transaction is submitted
    Then the transaction should include a Unix timestamp
    And the timestamp should be within 1 second of current time

  Scenario: Blockchain transaction includes transaction_id
    Given mortgage id 1 has transaction_id "txn-12345"
    When the blockchain transaction is submitted
    Then the blockchain record should include transaction_id "txn-12345"

  # Error Handling
  Scenario: Graceful handling of blockchain timeout
    Given the blockchain service has high latency
    When a mortgage activation is attempted
    Then the operation should timeout after 10 seconds
    And an error should be logged
    And the mortgage should still be activated locally

  Scenario: Retry logic on blockchain failure
    Given the blockchain service fails once then succeeds
    When a mortgage activation is attempted
    Then the system should retry the blockchain submission
    And the blockchain hash should eventually be stored

  # Blockchain Hash Validation
  Scenario: Blockchain hash format validation
    When a blockchain hash is returned
    Then the hash should be a non-empty string
    And the hash should be stored in the database

  Scenario: Only 2 blockchain hash fields for mortgage lifecycle
    Given a mortgage goes through full lifecycle (PENDING → ACTIVE → RELEASED)
    When I check the mortgage record
    Then it should have:
      | blockchain_hash              | activation_hash    |
      | release_blockchain_hash      | release_hash       |
    And both hashes should be different
    And cancellation_hash should be null
    And release_cancellation_hash should be null
