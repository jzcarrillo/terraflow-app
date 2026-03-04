const usersController = require('../users');
const usersService = require('../../services/users');

jest.mock('../../services/users', () => ({
  getAllUsers: jest.fn()
}));

describe('Users Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, user: { id: 1 }, headers: { authorization: 'Bearer test-token' } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      const mockResult = { success: true, users: [] };
      usersService.getAllUsers.mockResolvedValue(mockResult);

      await usersController.getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });
});
