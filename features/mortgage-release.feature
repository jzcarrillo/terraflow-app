Feature: Mortgage Release
  As a bank user
  I want to release mortgages
  So that property owners can clear their encumbrances

  Background:
    Given the following mortgages exist:
      | id | land_title_id | bank_name | bank_user_id | amount  | status  |
      | 1  | 1             | BDO       | 100          | 5000000 | ACTIVE  |
      | 2  | 1             | BPI       | 200          | 3000000 | ACTIVE  |
      | 3  | 2             | Metrobank | 100          | 2000000 | PENDING |
    And I am logged in as a bank user with id 100

  # Release Flow:
  # 1. POST /mortgages/:id/release → createReleaseMortgage()
  # 2. Publish CREATE_RELEASE_PAYMENT event to queue_payments
  # 3. Payment service creates payment with reference_type: 'mortgage_release'
  # 4. User confirms payment → PAYMENT_STATUS_UPDATE event
  # 5. handleMortgageReleasePayment() → ACTIVE to RELEASED
  # 6. Record to blockchain → store release_blockchain_hash

  Scenario: Successfully create mortgage release
    Given mortgage id 1 has status "ACTIVE"
    And I am the bank user who created mortgage id 1
    When I create a release for mortgage id 1
    Then the release should be created successfully
    And a release payment should be created
    And the release payment status should be "PENDING"

  Scenario: Only ACTIVE mortgages can be released
    Given mortgage id 3 has status "PENDING"
    When I attempt to create a release for mortgage id 3
    Then the release creation should fail
    And I should see mortgage error "Only ACTIVE mortgages can be released"

  Scenario: Only creating bank can release mortgage
    Given mortgage id 2 was created by bank user 200
    And I am bank user 100
    When I attempt to create a release for mortgage id 2
    Then the release creation should fail
    And I should see mortgage error "Only the bank that created the mortgage can release it"

  Scenario: Update mortgage release payment details
    Given mortgage id 1 has a PENDING release payment
    When I update the release payment with:
      | release_fee | 10000 |
    Then the release payment should be updated successfully
    And the release_fee should be 10000

  Scenario: Cancel mortgage release payment (PENDING)
    Given mortgage id 1 has a PENDING release payment
    When I cancel the release payment
    Then the release payment status should be "CANCELLED"
    And the mortgage status should remain "ACTIVE"

  Scenario: Cancel mortgage release payment (PAID) reverts to ACTIVE
    Given mortgage id 1 has status "RELEASED"
    And the release payment has status "PAID"
    When I cancel the release payment
    Then the release payment status should be "CANCELLED"
    And the mortgage status should revert to "ACTIVE"
    And a release cancellation blockchain hash should be generated

  Scenario: Pay mortgage release fee to release mortgage
    Given mortgage id 1 has a PENDING release payment
    When I pay the release fee
    Then the release payment status should be "PAID"
    And the mortgage status should become "RELEASED"
    And a release blockchain hash should be generated
    And the blockchain hash should be stored in release_blockchain_hash field

  Scenario: Released mortgage does not block land title transfer
    Given mortgage id 1 has status "RELEASED"
    When I check transfer eligibility for land title 1
    Then the land title should be eligible for transfer

  Scenario: Multiple mortgages can be released independently
    Given land title 1 has 2 ACTIVE mortgages with id 1 and 2
    When I release mortgage id 1
    Then mortgage id 1 status should be "RELEASED"
    And mortgage id 2 status should remain "ACTIVE"
    And land title 1 should still not be eligible for transfer

  Scenario: All mortgages released allows transfer
    Given land title 1 has 2 mortgages
    And both mortgages have status "RELEASED"
    When I check transfer eligibility for land title 1
    Then the land title should be eligible for transfer

  Scenario: Blockchain event on mortgage release
    Given mortgage id 1 has status "ACTIVE"
    When the release payment is confirmed
    Then a blockchain event should be triggered
    And the event should contain:
      | field            | value            |
      | mortgage_id      | 1                |
      | previous_status  | ACTIVE           |
      | new_status       | RELEASED         |
      | transaction_type | MORTGAGE_RELEASE |
    And the blockchain hash should be stored

  Scenario: Mortgage not found error on release
    When I attempt to create a release for mortgage id 999
    Then the release creation should fail
    And I should see mortgage error "Mortgage not found"
