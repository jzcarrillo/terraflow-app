const usersController = require('../users');
const usersService = require('../../services/users');

jest.mock('../../services/users');
jest.mock('bcryptjs');
jest.mock('../../schemas/users');
jest.mock('../../services/publisher');

describe('Users Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, user: { id: 1 }, headers: { authorization: 'Bearer test-token' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      const mockResult = { success: true, users: [] };
      usersService.getAllUsers = jest.fn().mockResolvedValue(mockResult);

      await usersController.getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors', async () => {
      usersService.getAllUsers = jest.fn().mockRejectedValue(new Error('Error'));

      await usersController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('validateUser', () => {
    it('should validate user', async () => {
      req.query = { username: 'testuser', email_address: 'test@test.com' };
      usersService.validateUser = jest.fn().mockResolvedValue({ valid: true });

      await usersController.validateUser(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.query = { username: 'testuser', email_address: 'test@test.com' };
      usersService.validateUser = jest.fn().mockRejectedValue(new Error('Error'));

      await usersController.validateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createUser', () => {
    it('should create user', async () => {
      req.body = { 
        username: 'test', 
        password: 'test123', 
        confirm_password: 'test123', 
        email_address: 'test@test.com', 
        first_name: 'Test', 
        last_name: 'User', 
        location: 'Manila', 
        role: 'ADMIN' 
      };
      
      const { userSchema } = require('../../schemas/users');
      userSchema.parse = jest.fn().mockReturnValue(req.body);
      usersService.validateUser = jest.fn().mockResolvedValue({ valid: true });
      
      const bcrypt = require('bcryptjs');
      bcrypt.hash = jest.fn().mockResolvedValue('hashedpassword');
      
      const rabbitmq = require('../../services/publisher');
      rabbitmq.publishToQueue = jest.fn().mockResolvedValue(true);

      await usersController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('should reject duplicate user', async () => {
      req.body = { username: 'test', email_address: 'test@test.com' };
      
      const { userSchema } = require('../../schemas/users');
      userSchema.parse = jest.fn().mockReturnValue(req.body);
      usersService.validateUser = jest.fn().mockResolvedValue({ valid: false, message: 'User exists' });

      await usersController.createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      req.body = { username: 'test', password: 'test123' };
      usersService.getUserByUsername = jest.fn().mockResolvedValue({ 
        success: true, 
        user: { 
          id: 1, 
          username: 'test', 
          email_address: 'test@test.com', 
          password_hash: 'hashedpassword', 
          role: 'user', 
          first_name: 'Test', 
          last_name: 'User' 
        } 
      });
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      await usersController.login(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should reject missing credentials', async () => {
      req.body = {};

      await usersController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject user not found', async () => {
      req.body = { username: 'test', password: 'test123' };
      usersService.getUserByUsername = jest.fn().mockResolvedValue({ success: false });

      await usersController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should reject invalid password', async () => {
      req.body = { username: 'test', password: 'wrong' };
      usersService.getUserByUsername = jest.fn().mockResolvedValue({ 
        success: true, 
        user: { id: 1, username: 'test', password_hash: 'hashedpassword' } 
      });
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await usersController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle errors', async () => {
      req.body = { username: 'test', password: 'test123' };
      usersService.getUserByUsername = jest.fn().mockRejectedValue(new Error('Error'));

      await usersController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      req.params.userId = '1';
      req.body = { role: 'admin' };
      usersService.updateUserRole = jest.fn().mockResolvedValue({ success: true });

      await usersController.updateUserRole(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.params.userId = '1';
      req.body = { role: 'admin' };
      usersService.updateUserRole = jest.fn().mockRejectedValue(new Error('Error'));

      await usersController.updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
