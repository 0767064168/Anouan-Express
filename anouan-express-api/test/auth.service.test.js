const db = require('../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

  it('rotates refresh tokens using a hashed stored value and rejects replayed tokens', async () => {
    const oldRefreshToken = jwt.sign({ sub: 'user-1' }, process.env.JWT_REFRESH_SECRET || 'dev_only_refresh_change_me_32_chars', { expiresIn: '7d' });
    const oldStoredHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

    db.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          role: 'client',
          status: 'active',
          refresh_token: oldStoredHash,
        }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await authService.refreshAccessToken({ refreshToken: oldRefreshToken });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(db.query.mock.calls[1][0]).toContain('UPDATE users SET refresh_token = $1');
    expect(db.query.mock.calls[1][1][0]).not.toBe(oldStoredHash);
    expect(db.query.mock.calls[1][1][0]).toBe(
      crypto.createHash('sha256').update(result.refreshToken).digest('hex')
    );

    const replayedHash = crypto.createHash('sha256').update(result.refreshToken).digest('hex');
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'user-1',
        role: 'client',
        status: 'active',
        refresh_token: replayedHash,
      }],
    });

    await expect(
      authService.refreshAccessToken({ refreshToken: oldRefreshToken })
    ).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN' });
  });

  it('rejects OTP login for banned accounts', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'user-1',
        status: 'banned',
        otp_code: '123456',
        otp_expires_at: new Date(Date.now() + 60_000),
      }],
    });

    await expect(
      authService.verifyOTP({ phone: '+2250700000000', otp: '123456' })
    ).rejects.toMatchObject({ code: 'ACCOUNT_BANNED' });
  });

  it('rejects password login for a vendor waiting for admin activation', async () => {
    const passwordHash = await bcrypt.hash('secret123', 4);
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'vendor-user',
        name: 'Vendeur Test',
        email: 'vendor@example.com',
        password_hash: passwordHash,
        role: 'client',
        status: 'active',
        vendor_validation_status: 'pending',
      }],
    });

    await expect(
      authService.loginWithPassword({ email: 'vendor@example.com', password: 'secret123' })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'VENDOR_NOT_APPROVED',
    });

    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('allows password login for an approved vendor', async () => {
    const passwordHash = await bcrypt.hash('secret123', 4);
    db.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'vendor-user',
          name: 'Vendeur Test',
          email: 'vendor@example.com',
          password_hash: passwordHash,
          role: 'vendor',
          status: 'active',
          vendor_validation_status: 'approved',
        }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const result = await authService.loginWithPassword({
      email: 'vendor@example.com',
      password: 'secret123',
    });

    expect(result.user).toMatchObject({ id: 'vendor-user', role: 'vendor' });
    expect(result.accessToken).toEqual(expect.any(String));
  });
});
