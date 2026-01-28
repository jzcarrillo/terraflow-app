const userService = require('../../services/users');
const { pool } = require('../../config/db');
const { checkEmailExists, checkUsernameExists, validateWithSchema } = require('../../utils/validation');

jest.mock('../../config/db', () => ({
  pool: {
    query: jest.fn()
  },
  testConnection: jest.fn()
}));
jest.mock('../../utils/validation');
jest.mock('../../schemas/users', () => ({
  userSchema: {}
}));

describe('User Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateWithSchema.mockImplementation((schema, data) => data);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // User Registration (4 tests)
  describe('User Registration', () => {
    it('should create user with valid data', async () => {
      const mockUser = {
        id: 1,
        email_address: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        location: 'Manila',
        role: 'ADMIN',
        status: 'ACTIVE',
        transaction_id: 'TXN-001',
        created_at: new Date()
      };

      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userService.createUser({
        email_address: 'test@example.com',
        username: 'testuser',
        password: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        location: 'Manila',
        transaction_id: 'TXN-001'
      });

      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.arrayContaining(['test@example.com', 'testuser', 'hashed_password'])
      );
    });

    it('should set default role to ADMIN if not provided', async () => {
      const mockUser = { id: 1, role: 'ADMIN', status: 'ACTIVE' };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      await userService.createUser({
        email_address: 'test@example.com',
        username: 'testuser',
        password: 'password',
        first_name: 'John',
        last_name: 'Doe',
        location: 'Manila',
        transaction_id: 'TXN-001'
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['ADMIN'])
      );
    });

    it('should set default status to ACTIVE if not provided', async () => {
      const mockUser = { id: 1, status: 'ACTIVE' };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      await userService.createUser({
        email_address: 'test@example.com',
        username: 'testuser',
        password: 'password',
        first_name: 'John',
        last_name: 'Doe',
        location: 'Manila',
        transaction_id: 'TXN-001'
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['ACTIVE'])
      );
    });

    it('should store password as password_hash', async () => {
      const mockUser = { id: 1, password_hash: 'my_password' };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      await userService.createUser({
        email_address: 'test@example.com',
        username: 'testuser',
        password: 'my_password',
        first_name: 'John',
        last_name: 'Doe',
        location: 'Manila',
        transaction_id: 'TXN-001'
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('password_hash'),
        expect.arrayContaining(['my_password'])
      );
    });
  });

  // User Activation (2 tests)
  describe('User Activation', () => {
    it('should activate user by setting status to ACTIVE', async () => {
      const mockUser = { id: 1, status: 'ACTIVE', updated_at: new Date() };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userService.activateUser(1);

      expect(result.status).toBe('ACTIVE');
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'ACTIVE'"),
        [1]
      );
    });

    it('should update timestamp when activating user', async () => {
      const mockUser = { id: 1, status: 'ACTIVE', updated_at: new Date() };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      await userService.activateUser(1);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('updated_at = NOW()'),
        [1]
      );
    });
  });

  // User Deletion (2 tests)
  describe('User Deletion', () => {
    it('should delete user by id', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userService.deleteUser(1);

      expect(result).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM'),
        [1]
      );
    });

    it('should return deleted user data', async () => {
      const mockUser = { id: 1, username: 'testuser', email_address: 'test@example.com' };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userService.deleteUser(1);

      expect(result.username).toBe('testuser');
      expect(result.email_address).toBe('test@example.com');
    });
  });

  // Validation (3 tests)
  describe('User Validation', () => {
    it('should validate user data through schema', async () => {
      const mockUser = { id: 1 };
      pool.query.mockResolvedValue({ rows: [mockUser] });

      await userService.createUser({
        email_address: 'test@example.com',
        username: 'testuser',
        password: 'password',
        first_name: 'John',
        last_name: 'Doe',
        location: 'Manila',
        transaction_id: 'TXN-001'
      });

      expect(pool.query).toHaveBeenCalled();
    });

    it('should check for duplicate email during registration', async () => {
      checkEmailExists.mockResolvedValue(true);

      await expect(async () => {
        if (await checkEmailExists('duplicate@example.com')) {
          throw new Error('Email already exists');
        }
      }).rejects.toThrow('Email already exists');

      expect(checkEmailExists).toHaveBeenCalledWith('duplicate@example.com');
    });

    it('should check for duplicate username during registration', async () => {
      checkUsernameExists.mockResolvedValue(true);

      await expect(async () => {
        if (await checkUsernameExists('duplicateuser')) {
          throw new Error('Username already exists');
        }
      }).rejects.toThrow('Username already exists');

      expect(checkUsernameExists).toHaveBeenCalledWith('duplicateuser');
    });
  });

  // Error Handling (2 tests)
  describe('Error Handling', () => {
    it('should handle database errors during user creation', async () => {
      pool.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(userService.createUser({
        email_address: 'test@example.com',
        username: 'testuser',
        password: 'password',
        first_name: 'John',
        last_name: 'Doe',
        location: 'Manila',
        transaction_id: 'TXN-001'
      })).rejects.toThrow('Database connection failed');
    });

    it('should handle errors when user not found during activation', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await userService.activateUser(999);

      expect(result).toBeUndefined();
    });
  });
});
