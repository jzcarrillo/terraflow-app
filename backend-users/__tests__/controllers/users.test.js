const userController = require('../../controllers/users');
const { executeQuery } = require('../../utils/database');
const { checkEmailExists, checkUsernameExists } = require('../../utils/validation');

jest.mock('../../utils/database');
jest.mock('../../utils/validation');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getUserByUsername', () => {
    it('should return user by username', async () => {
      req.params.username = 'testuser';
      const mockUser = { id: 1, username: 'testuser', email_address: 'test@example.com' };
      executeQuery.mockResolvedValue({ rows: [mockUser] });

      await userController.getUserByUsername(req, res);

      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 if user not found', async () => {
      req.params.username = 'nonexistent';
      executeQuery.mockResolvedValue({ rows: [] });

      await userController.getUserByUsername(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle errors', async () => {
      req.params.username = 'testuser';
      executeQuery.mockRejectedValue(new Error('DB error'));

      await userController.getUserByUsername(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [{ id: 1, username: 'user1' }, { id: 2, username: 'user2' }];
      executeQuery.mockResolvedValue({ rows: mockUsers });

      await userController.getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith({ users: mockUsers });
    });

    it('should handle errors', async () => {
      executeQuery.mockRejectedValue(new Error('DB error'));

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      req.params.userId = '1';
      req.body.role = 'BANK';
      const mockUser = { id: 1, role: 'BANK' };
      executeQuery.mockResolvedValue({ rows: [mockUser] });

      await userController.updateUserRole(req, res);

      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 if user not found', async () => {
      req.params.userId = '999';
      req.body.role = 'BANK';
      executeQuery.mockResolvedValue({ rows: [] });

      await userController.updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      req.params.userId = '1';
      req.body.role = 'BANK';
      executeQuery.mockRejectedValue(new Error('DB error'));

      await userController.updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateUser', () => {
    it('should return valid if no duplicates', async () => {
      req.query = { username: 'newuser', email_address: 'new@example.com' };
      checkUsernameExists.mockResolvedValue(false);
      checkEmailExists.mockResolvedValue(false);

      await userController.validateUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        valid: true,
        message: 'User data is valid. No duplicates found.'
      });
    });

    it('should return invalid if username exists', async () => {
      req.query = { username: 'existinguser', email_address: 'new@example.com' };
      checkUsernameExists.mockResolvedValue(true);

      await userController.validateUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        message: 'Username already exists'
      });
    });

    it('should return invalid if email exists', async () => {
      req.query = { username: 'newuser', email_address: 'existing@example.com' };
      checkUsernameExists.mockResolvedValue(false);
      checkEmailExists.mockResolvedValue(true);

      await userController.validateUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        message: 'Email address already exists'
      });
    });

    it('should handle errors', async () => {
      req.query = { username: 'newuser', email_address: 'new@example.com' };
      checkUsernameExists.mockRejectedValue(new Error('DB error'));

      await userController.validateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
