Feature: Mortgage Payment
  As a bank user
  I want to pay mortgage fees
  So that mortgages can be activated and released

  Background:
    Given the following mortgages exist:
      | id | land_title_id | bank_name | amount  | status   | lien_position |
      | 1  | 1             | BDO       | 5000000 | PENDING  | 1             |
      | 2  | 1             | BPI       | 3000000 | ACTIVE   | 2             |
      | 3  | 2             | Metrobank | 2000000 | RELEASED | 1             |
    And I am logged in as a bank user

  # Mortgage Activation Payment Scenarios
  Scenario: Mortgage dropdown shows only PENDING mortgages
    Given I select reference_type "mortgage"
    When I request the mortgage dropdown
    Then I should see only mortgages with status "PENDING"
    And I should see mortgage id 1 in the dropdown
    And I should not see mortgage id 2 in the dropdown
    And I should not see mortgage id 3 in the dropdown

  Scenario: Successfully pay mortgage fee to activate
    Given mortgage id 1 has status "PENDING"
    When I create a payment with:
      | reference_type | mortgage |
      | reference_id   | 1        |
      | amount         | 5000     |
    And I confirm the payment
    Then the payment status should be "PAID"
    And an event should be sent to activate the mortgage
    And mortgage id 1 status should become "ACTIVE"
    And a blockchain hash should be generated
    And the blockchain hash should be stored in mortgage

  Scenario: Cannot activate mortgage if 3 ACTIVE mortgages already exist
    Given land title 1 has 3 ACTIVE mortgages
    And mortgage id 4 has status "PENDING" for land title 1
    When I pay mortgage id 4
    Then the payment should fail
    And I should see error "Cannot activate mortgage: Maximum 3 active mortgages already reached"

  Scenario: Edit mortgage payment details while PENDING
    Given mortgage payment id 1 has status "PENDING"
    When I update the payment amount to 6000
    Then the payment should be updated successfully
    And the payment amount should be 6000

  Scenario: Cancel PENDING mortgage payment
    Given mortgage payment id 1 has status "PENDING"
    When I cancel the payment
    Then the payment status should be "CANCELLED"
    And the mortgage status should remain "PENDING"
    And no blockchain event should be triggered

  Scenario: Cannot cancel PAID mortgage payment
    Given mortgage id 1 has status "ACTIVE"
    And mortgage payment id 1 has status "PAID"
    When I attempt to cancel the payment
    Then the cancellation should fail
    And I should see error "Cannot cancel PAID mortgage payment"
    And the mortgage status should remain "ACTIVE"
    And the blockchain hash should remain unchanged

  # Mortgage Release Payment Scenarios
  Scenario: Mortgage release dropdown shows only ACTIVE mortgages
    Given I select reference_type "mortgage_release"
    When I request the mortgage dropdown
    Then I should see only mortgages with status "ACTIVE"
    And I should see mortgage id 2 in the dropdown
    And I should not see mortgage id 1 in the dropdown
    And I should not see mortgage id 3 in the dropdown

  Scenario: Successfully pay mortgage release fee
    Given mortgage id 2 has status "ACTIVE"
    When I create a release payment with:
      | reference_type | mortgage_release |
      | reference_id   | 2                |
      | amount         | 3000             |
    And I confirm the payment
    Then the payment status should be "PAID"
    And an event should be sent to release the mortgage
    And mortgage id 2 status should become "RELEASED"
    And a release blockchain hash should be generated
    And the release blockchain hash should be stored in mortgage

  Scenario: Edit mortgage release payment while PENDING
    Given mortgage release payment id 2 has status "PENDING"
    When I update the release payment amount to 3500
    Then the payment should be updated successfully

  Scenario: Cancel PENDING mortgage release payment
    Given mortgage release payment id 2 has status "PENDING"
    When I cancel the release payment
    Then the payment status should be "CANCELLED"
    And the mortgage status should remain "ACTIVE"

  Scenario: Cancel PAID mortgage release payment reverts to ACTIVE
    Given mortgage id 2 has status "RELEASED"
    And mortgage release payment id 2 has status "PAID"
    When I cancel the release payment
    Then the payment status should be "CANCELLED"
    And an event should be sent to revert the mortgage
    And mortgage id 2 status should become "ACTIVE"
    And a release cancellation blockchain hash should be generated

  Scenario: Blockchain event triggered on mortgage activation
    Given mortgage id 1 has status "PENDING"
    When the mortgage payment is confirmed
    Then a blockchain event should be triggered
    And the event should contain:
      | mortgage_id     | 1       |
      | status          | ACTIVE  |
      | transaction_type| MORTGAGE_ACTIVATION |

  Scenario: Blockchain event triggered on mortgage release
    Given mortgage id 2 has status "ACTIVE"
    When the mortgage release payment is confirmed
    Then a blockchain event should be triggered
    And the event should contain:
      | mortgage_id     | 2       |
      | status          | RELEASED|
      | transaction_type| MORTGAGE_RELEASE |
