const { Given, When, Then, Before, setDefaultTimeout } = require('@cucumber/cucumber');
const assert = require('assert');

setDefaultTimeout(10000);

// Mock services
const mockUserService = {
  users: new Map(),
  tokens: new Map(),
  
  register: async (userData) => {
    if (mockUserService.users.has(userData.email)) {
      throw new Error('Email already registered');
    }
    
    if (!userData.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    
    if (userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    const userId = `USER-${Date.now()}`;
    const activationToken = `TOKEN-${Date.now()}`;
    
    const user = {
      id: userId,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      first_name: userData.first_name,
      last_name: userData.last_name,
      contact_number: userData.contact_number,
      status: 'PENDING',
      activation_token: activationToken,
      created_at: new Date()
    };
    
    mockUserService.users.set(userData.email, user);
    return { userId, activationToken };
  },
  
  activate: async (token) => {
    for (const [email, user] of mockUserService.users.entries()) {
      if (user.activation_token === token) {
        user.status = 'ACTIVE';
        user.activation_token = null;
        return { success: true, userId: user.id };
      }
    }
    throw new Error('Invalid activation token');
  },
  
  login: async (username, password) => {
    let user = null;
    
    for (const [email, u] of mockUserService.users.entries()) {
      if (u.username === username) {
        user = u;
        break;
      }
    }
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.status !== 'ACTIVE') {
      throw new Error('Account not activated');
    }
    
    if (user.password !== password) {
      throw new Error('Invalid credentials');
    }
    
    const authToken = `AUTH-${Date.now()}`;
    mockUserService.tokens.set(authToken, user.id);
    
    return { 
      token: authToken, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    };
  }
};

// Test context
let testContext = {};

Before(function() {
  testContext = {
    registrationData: {},
    registrationResult: null,
    activationToken: null,
    loginResult: null,
    error: null
  };
  mockUserService.users.clear();
  mockUserService.tokens.clear();
});

// Background steps
Given('the user service is running', function() {
  assert.ok(mockUserService, 'User service should be available');
});

Given('the database is clean', function() {
  mockUserService.users.clear();
  mockUserService.tokens.clear();
});

// Registration steps
Given('I am on the registration page', function() {
  testContext.onRegistrationPage = true;
});

Given('a user exists with email {string}', async function(email) {
  await mockUserService.register({
    username: 'existing_user',
    email: email,
    password: 'ExistingPass123!',
    first_name: 'Existing',
    last_name: 'User',
    contact_number: '09111111111'
  });
});

Given('an active user exists with:', async function(dataTable) {
  const data = dataTable.rowsHash();
  const result = await mockUserService.register({
    username: data.username,
    email: 'active@example.com',
    password: data.password,
    first_name: 'Active',
    last_name: 'User',
    contact_number: '09222222222'
  });
  await mockUserService.activate(result.activationToken);
});

Given('an active user exists with username {string}', async function(username) {
  const result = await mockUserService.register({
    username: username,
    email: `${username}@example.com`,
    password: 'ValidPass123!',
    first_name: 'Test',
    last_name: 'User',
    contact_number: '09333333333'
  });
  await mockUserService.activate(result.activationToken);
});

Given('a pending user exists with username {string}', async function(username) {
  await mockUserService.register({
    username: username,
    email: `${username}@example.com`,
    password: 'ValidPass123!',
    first_name: 'Pending',
    last_name: 'User',
    contact_number: '09444444444'
  });
});

Given('I have registered with email {string}', async function(email) {
  const result = await mockUserService.register({
    username: 'test_user',
    email: email,
    password: 'TestPass123!',
    first_name: 'Test',
    last_name: 'User',
    contact_number: '09555555555'
  });
  testContext.registrationResult = result;
  testContext.activationToken = result.activationToken;
});

Given('I received an activation token', function() {
  assert.ok(testContext.activationToken, 'Activation token should exist');
});

Given('I am a new user', function() {
  testContext.isNewUser = true;
});

When('I register with the following details:', async function(dataTable) {
  const data = dataTable.rowsHash();
  try {
    testContext.registrationResult = await mockUserService.register(data);
    testContext.registrationData = data;
  } catch (error) {
    testContext.error = error.message;
  }
});

When('I register with email {string}', async function(email) {
  try {
    testContext.registrationResult = await mockUserService.register({
      username: 'test_user',
      email: email,
      password: 'TestPass123!',
      first_name: 'Test',
      last_name: 'User',
      contact_number: '09666666666'
    });
  } catch (error) {
    testContext.error = error.message;
  }
});

When('I register with password {string}', async function(password) {
  try {
    testContext.registrationResult = await mockUserService.register({
      username: 'test_user',
      email: 'test@example.com',
      password: password,
      first_name: 'Test',
      last_name: 'User',
      contact_number: '09777777777'
    });
  } catch (error) {
    testContext.error = error.message;
  }
});

When('I register with username {string} and email {string}', async function(username, email) {
  try {
    testContext.registrationResult = await mockUserService.register({
      username: username,
      email: email,
      password: 'SecurePass123!',
      first_name: 'Test',
      last_name: 'User',
      contact_number: '09888888888'
    });
    testContext.registrationData = { username, email, password: 'SecurePass123!' };
  } catch (error) {
    testContext.error = error.message;
  }
});

When('I activate my account with the token', async function() {
  try {
    const result = await mockUserService.activate(testContext.activationToken);
    testContext.activationResult = result;
  } catch (error) {
    testContext.error = error.message;
  }
});

When('I activate my account', async function() {
  const result = await mockUserService.activate(testContext.registrationResult.activationToken);
  testContext.activationResult = result;
});

When('I login with username {string} and password {string}', async function(username, password) {
  try {
    testContext.loginResult = await mockUserService.login(username, password);
  } catch (error) {
    testContext.error = error.message;
  }
});

When('I login with my credentials', async function() {
  testContext.loginResult = await mockUserService.login(
    testContext.registrationData.username,
    testContext.registrationData.password
  );
});

Then('the registration should be successful', function() {
  assert.ok(testContext.registrationResult, 'Registration should succeed');
  assert.ok(testContext.registrationResult.userId, 'User ID should be returned');
});

Then('I should receive a user ID', function() {
  assert.ok(testContext.registrationResult.userId, 'User ID should exist');
});

Then('the user status should be {string}', function(expectedStatus) {
  const email = testContext.registrationData.email || 'juan@example.com';
  const user = mockUserService.users.get(email);
  assert.strictEqual(user.status, expectedStatus);
});

Then('an activation email should be sent', function() {
  assert.ok(testContext.registrationResult.activationToken, 'Activation token should exist');
});

Then('I should see error {string}', function(expectedError) {
  assert.strictEqual(testContext.error, expectedError);
});

Then('my account should be activated', function() {
  assert.ok(testContext.activationResult, 'Activation should succeed');
});

Then('I should be able to login', async function() {
  const loginResult = await mockUserService.login('test_user', 'TestPass123!');
  assert.ok(loginResult.token, 'Login should succeed after activation');
});

Then('the login should be successful', function() {
  assert.ok(testContext.loginResult, 'Login should succeed');
  assert.ok(testContext.loginResult.token, 'Auth token should be returned');
});

Then('the login should fail', function() {
  assert.ok(testContext.error, 'Login should fail with error');
});

Then('I should receive an authentication token', function() {
  assert.ok(testContext.loginResult.token, 'Auth token should exist');
});

Then('I should see my user profile', function() {
  assert.ok(testContext.loginResult.user, 'User profile should be returned');
  assert.ok(testContext.loginResult.user.username, 'Username should exist');
  assert.ok(testContext.loginResult.user.email, 'Email should exist');
});

Then('I should be authenticated', function() {
  assert.ok(testContext.loginResult, 'User should be authenticated');
  assert.ok(testContext.loginResult.token, 'Auth token should exist');
});

Then('I should be able to access land title registration', function() {
  const token = testContext.loginResult.token;
  const userId = mockUserService.tokens.get(token);
  assert.ok(userId, 'User should have valid session for land title access');
});

Then('the registration should fail', function() {
  assert.ok(testContext.error, 'User registration should fail with error');
});
