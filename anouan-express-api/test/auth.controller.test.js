jest.mock('../src/modules/auth/auth.service', () => ({
  refreshAccessToken: jest.fn(),
  logout: jest.fn(),
}));

const authService = require('../src/modules/auth/auth.service');
const authController = require('../src/modules/auth/auth.controller');

const createResponse = () => ({
  clearCookie: jest.fn(),
  cookie: jest.fn(),
  json: jest.fn(),
});

describe('auth.controller refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
  });

  it('clears stale auth cookies when refresh authentication fails', async () => {
    const error = Object.assign(new Error('Refresh token invalide ou expiré.'), { statusCode: 401 });
    authService.refreshAccessToken.mockRejectedValueOnce(error);
    const req = { cookies: { refreshToken: 'expired-refresh-token' }, body: {} };
    const res = createResponse();
    const next = jest.fn();

    await authController.refresh(req, res, next);

    expect(res.clearCookie).toHaveBeenCalledTimes(3);
    expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.objectContaining({ path: '/', maxAge: 0 }));
    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ path: '/', maxAge: 0 }));
    expect(res.clearCookie).toHaveBeenCalledWith('csrfToken', expect.objectContaining({ path: '/' }));
    expect(next).toHaveBeenCalledWith(error);
  });

  it('does not clear auth cookies for server errors', async () => {
    const error = Object.assign(new Error('Database unavailable.'), { statusCode: 500 });
    authService.refreshAccessToken.mockRejectedValueOnce(error);
    const req = { cookies: { refreshToken: 'refresh-token' }, body: {} };
    const res = createResponse();
    const next = jest.fn();

    await authController.refresh(req, res, next);

    expect(res.clearCookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });
});
