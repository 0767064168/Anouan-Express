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
    jest.resetModules();
    jest.resetAllMocks();
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.NODE_ENV;
  });

  it('rejects identical or weak JWT secrets in production', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJwtSecret = process.env.JWT_SECRET;
    const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;

    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = '12345678901234567890123456789012';
    process.env.JWT_REFRESH_SECRET = '12345678901234567890123456789012';

    jest.isolateModules(() => {
      expect(() => require('../src/config/env')).toThrow(/JWT_SECRET.*JWT_REFRESH_SECRET/i);
    });

    if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalJwtSecret;
    if (originalRefreshSecret === undefined) delete process.env.JWT_REFRESH_SECRET; else process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
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
    const originalNodeEnv = process.env.NODE_ENV;
    const originalJwtSecret = process.env.JWT_SECRET;
    const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;

    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = '12345678901234567890123456789012';
    process.env.JWT_REFRESH_SECRET = 'abcdefghijklmnopqrstuvwxzy123456';

    jest.resetModules();
    const freshDb = require('../src/config/database');
    const freshAuthService = require('../src/modules/auth/auth.service');

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const oldRefreshToken = jwt.sign({ sub: 'user-1' }, refreshSecret, { expiresIn: '7d' });
    const oldStoredHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
    let currentStoredRefreshHash = oldStoredHash;

    freshDb.query.mockImplementation((sql, params = []) => {
      if (sql.includes('SELECT id, role, status, refresh_token FROM users WHERE id = $1')) {
        return Promise.resolve({
          rows: [{
            id: 'user-1',
            role: 'client',
            status: 'active',
            refresh_token: currentStoredRefreshHash,
          }],
        });
      }

      if (sql.includes('UPDATE users SET refresh_token = $1 WHERE id = $2')) {
        currentStoredRefreshHash = crypto.createHash('sha256').update(params[0]).digest('hex');
        return Promise.resolve({ rows: [] });
      }

      return Promise.resolve({ rows: [] });
    });

    const result = await freshAuthService.refreshAccessToken({ refreshToken: oldRefreshToken });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(freshDb.query.mock.calls[1][0]).toContain('UPDATE users SET refresh_token = $1');
    expect(freshDb.query.mock.calls[1][1][0]).not.toBe(oldStoredHash);
    expect(freshDb.query.mock.calls[1][1][0]).toBe(
      crypto.createHash('sha256').update(result.refreshToken).digest('hex')
    );

    await expect(
      freshAuthService.refreshAccessToken({ refreshToken: oldRefreshToken })
    ).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN' });

    if (originalNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = originalJwtSecret;
    if (originalRefreshSecret === undefined) delete process.env.JWT_REFRESH_SECRET; else process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
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
