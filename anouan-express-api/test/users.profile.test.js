const db = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const usersService = require('../src/modules/users/users.service');

describe('users.service.updateMyProfile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects an email already used by another account', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 'other-user' }] });

    await expect(
      usersService.updateMyProfile('user-id', { email: 'Existing@Example.com' })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_EXISTS',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(email) = $1'),
      ['existing@example.com', 'user-id']
    );
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('normalizes a new email before updating the profile', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'user-id', email: 'new@example.com' }] });

    const result = await usersService.updateMyProfile('user-id', {
      email: ' New@Example.COM ',
    });

    expect(result).toMatchObject({ email: 'new@example.com' });
    expect(db.query.mock.calls[1][1]).toEqual(['new@example.com', 'user-id']);
  });
});