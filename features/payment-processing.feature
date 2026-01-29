Feature: Payment Processing
  As a user
  I want to create and manage payments
  So that I can complete land title registration transactions

  Background:
    Given the Terraflow system is running
    And the user is authenticated
    And a land title exists with status "PENDING"

  Scenario: Create payment with validation error
    Given I am on the payments page
    When I click create new payment
    And I submit without filling required fields
    Then I should see validation error messages
    And the payment should not be created

  Scenario: Successfully create payment
    Given I am on the payments page
    When I click create new payment
    And I fill in payment details
      | field           | value              |
      | transaction_id  | TXN-2024-001      |
      | amount          | 5000              |
      | payer_name      | Juan Dela Cruz    |
      | payment_method  | Credit Card       |
    And I submit the payment form
    Then the payment should be created successfully
    And the payment status should be "PENDING"

  Scenario: Update payment details
    Given a payment exists with transaction ID "TXN-2024-002"
    And the payment status is "PENDING"
    When I open the actions menu for the payment
    And I click update payment details
    And I change the amount to "6000"
    And I change the payment method to "Bank Transfer"
    And I submit the update
    Then the payment details should be updated
    And the payment status should remain "PENDING"

  Scenario: Confirm payment and activate land title
    Given a payment exists with transaction ID "TXN-2024-003"
    And the payment status is "PENDING"
    And the associated land title status is "PENDING"
    When I open the actions menu for the payment
    And I click confirm payment
    Then the payment status should change to "PAID"
    And the associated land title status should change to "ACTIVE"
    And a blockchain hash should be recorded

  Scenario: Cancel paid payment and revert land title
    Given a payment exists with transaction ID "TXN-2024-004"
    And the payment status is "PAID"
    And the associated land title status is "ACTIVE"
    When I open the actions menu for the payment
    And I click cancel payment
    Then the payment status should change to "CANCELLED"
    And the associated land title status should change to "PENDING"

  Scenario: Cancel pending payment
    Given a payment exists with transaction ID "TXN-2024-005"
    And the payment status is "PENDING"
    When I open the actions menu for the payment
    And I click cancel payment
    Then the payment status should change to "CANCELLED"
    And the associated land title status should remain "PENDING"
