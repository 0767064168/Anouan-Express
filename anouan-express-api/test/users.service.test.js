const db = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const usersService = require('../src/modules/users/users.service');

describe('users.service.updateUserStatus', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects attempts to change the current admin account status', async () => {
    await expect(
      usersService.updateUserStatus('admin-id', 'banned', 'admin-id')
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'SELF_STATUS_CHANGE',
    });

    expect(db.query).not.toHaveBeenCalled();
  });

  it('updates another user status', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'user-id', name: 'Client Test', status: 'banned' }],
    });

    const result = await usersService.updateUserStatus('user-id', 'banned', 'admin-id');

    expect(result).toMatchObject({ id: 'user-id', status: 'banned' });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET status'),
      ['banned', 'user-id']
    );
  });
});