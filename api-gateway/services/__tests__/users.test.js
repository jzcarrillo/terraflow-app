const userService = require('../users');
const axios = require('axios');

jest.mock('axios');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user', async () => {
      axios.get.mockResolvedValue({ data: { valid: true } });

      const result = await userService.validateUser('testuser', 'test@example.com');

      expect(result).toEqual({ valid: true });
    });

    it('should throw error on failure', async () => {
      axios.get.mockRejectedValue(new Error('Service error'));

      await expect(userService.validateUser('testuser', 'test@example.com')).rejects.toThrow('User validation service unavailable');
    });
  });

  describe('getUserByUsername', () => {
    it('should get user by username', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      axios.get.mockResolvedValue({ data: mockUser });

      const result = await userService.getUserByUsername('testuser');

      expect(result).toEqual({ success: true, user: mockUser });
    });

    it('should return not found for 404', async () => {
      axios.get.mockRejectedValue({ response: { status: 404 } });

      const result = await userService.getUserByUsername('nonexistent');

      expect(result).toEqual({ success: false, message: 'User not found' });
    });

    it('should throw error on service failure', async () => {
      axios.get.mockRejectedValue(new Error('Service error'));

      await expect(userService.getUserByUsername('testuser')).rejects.toThrow('User service unavailable');
    });
  });

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];
      axios.get.mockResolvedValue({ data: { users: mockUsers } });

      const result = await userService.getAllUsers('token');

      expect(result).toEqual({ success: true, users: mockUsers });
    });

    it('should handle data without users key', async () => {
      const mockUsers = [{ id: 1 }];
      axios.get.mockResolvedValue({ data: mockUsers });

      const result = await userService.getAllUsers('token');

      expect(result).toEqual({ success: true, users: mockUsers });
    });

    it('should throw error on failure', async () => {
      axios.get.mockRejectedValue(new Error('Service error'));

      await expect(userService.getAllUsers('token')).rejects.toThrow('Users service unavailable');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const mockUser = { id: 1, role: 'BANK' };
      axios.put.mockResolvedValue({ data: mockUser });

      const result = await userService.updateUserRole(1, 'BANK');

      expect(result).toEqual({ success: true, user: mockUser });
    });

    it('should throw error on failure', async () => {
      axios.put.mockRejectedValue(new Error('Service error'));

      await expect(userService.updateUserRole(1, 'BANK')).rejects.toThrow('User role update service unavailable');
    });
  });
});
