Feature: User Registration and Authentication
  As a new user
  I want to register and login to the system
  So that I can access land title registration features

  Background:
    Given the user service is running
    And the database is clean

  Scenario: Successful user registration
    Given I am on the registration page
    When I register with the following details:
      | field          | value                    |
      | username       | juan_delacruz            |
      | email          | juan@example.com         |
      | password       | SecurePass123!           |
      | first_name     | Juan                     |
      | last_name      | Dela Cruz                |
      | contact_number | 09123456789              |
    Then the registration should be successful
    And I should receive a user ID
    And the user status should be "PENDING"
    And an activation email should be sent

  Scenario: Registration with duplicate email
    Given a user exists with email "existing@example.com"
    When I register with email "existing@example.com"
    Then the registration should fail
    And I should see error "Email already registered"

  Scenario: Registration with invalid email format
    When I register with email "invalid-email"
    Then the registration should fail
    And I should see error "Invalid email format"

  Scenario: Registration with weak password
    When I register with password "123"
    Then the registration should fail
    And I should see error "Password must be at least 8 characters"

  Scenario: User account activation
    Given I have registered with email "juan@example.com"
    And I received an activation token
    When I activate my account with the token
    Then my account should be activated
    And the user status should be "ACTIVE"
    And I should be able to login

  Scenario: Successful login with valid credentials
    Given an active user exists with:
      | username | juan_delacruz    |
      | password | SecurePass123!   |
    When I login with username "juan_delacruz" and password "SecurePass123!"
    Then the login should be successful
    And I should receive an authentication token
    And I should see my user profile

  Scenario: Login with incorrect password
    Given an active user exists with username "juan_delacruz"
    When I login with username "juan_delacruz" and password "WrongPassword"
    Then the login should fail
    And I should see error "Invalid credentials"

  Scenario: Login with non-existent user
    When I login with username "nonexistent" and password "AnyPassword"
    Then the login should fail
    And I should see error "User not found"

  Scenario: Login with inactive account
    Given a pending user exists with username "inactive_user"
    When I login with username "inactive_user" and password "ValidPass123!"
    Then the login should fail
    And I should see error "Account not activated"

  Scenario: Complete user journey - Register, Activate, and Login
    Given I am a new user
    When I register with username "maria_santos" and email "maria@example.com"
    And I activate my account
    And I login with my credentials
    Then I should be authenticated
    And I should be able to access land title registration
