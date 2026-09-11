const db = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  withTransaction: jest.fn(),
}));

jest.mock('../src/utils/emailService', () => ({
  sendPasswordReset: jest.fn(),
}));

const authService = require('../src/modules/auth/auth.service');
const { sendPasswordReset } = require('../src/utils/emailService');

describe('auth.service password reset', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('stores a dedicated reset token instead of reusing otp fields', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'user-1', name: 'Alice' }] })
      .mockResolvedValueOnce({ rows: [] });

    await authService.forgotPassword({ email: 'alice@example.com' });

    expect(sendPasswordReset).toHaveBeenCalledTimes(1);

    const resetUpdateCall = db.query.mock.calls.find(([sql]) => /reset_token/.test(sql));
    expect(resetUpdateCall).toBeDefined();
    expect(resetUpdateCall[0]).toContain('reset_token = $1');
    expect(resetUpdateCall[0]).toContain('reset_token_expires_at = $2');
    expect(resetUpdateCall[1]).toEqual([expect.any(String), expect.any(Date), 'user-1']);
    expect(resetUpdateCall[0]).not.toContain('otp_code = $1');
  });

  it('resets the password when the token is valid and clears the reset metadata', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          reset_token: 'valid-token',
          reset_token_expires_at: new Date(Date.now() + 60_000),
        }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await authService.resetPassword({
      token: 'valid-token',
      email: 'alice@example.com',
      newPassword: 'NewPassword123',
    });

    expect(result).toMatchObject({ message: 'Mot de passe réinitialisé avec succès.' });

    const updateCall = db.query.mock.calls.find(([sql]) => /UPDATE users SET password_hash/.test(sql));
    expect(updateCall).toBeDefined();
    expect(updateCall[0]).toContain('reset_token = NULL');
    expect(updateCall[0]).toContain('reset_token_expires_at = NULL');
    expect(updateCall[1]).toEqual([expect.any(String), 'user-1']);
  });

  it('rejects invalid reset tokens', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'user-1',
        reset_token: 'actual-token',
        reset_token_expires_at: new Date(Date.now() + 60_000),
      }],
    });

    await expect(
      authService.resetPassword({
        token: 'wrong-token',
        email: 'alice@example.com',
        newPassword: 'NewPassword123',
      })
    ).rejects.toMatchObject({ code: 'INVALID_RESET_TOKEN' });
  });

  it('rejects expired reset tokens using the dedicated reset metadata', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'user-1',
        reset_token: 'expired-token',
        reset_token_expires_at: new Date(Date.now() - 60_000),
      }],
    });

    await expect(
      authService.resetPassword({
        token: 'expired-token',
        email: 'alice@example.com',
        newPassword: 'NewPassword123',
      })
    ).rejects.toMatchObject({ code: 'RESET_TOKEN_EXPIRED' });
  });
});
