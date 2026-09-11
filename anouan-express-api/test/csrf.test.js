const { csrfProtection, createCsrfToken } = require('../src/middlewares/csrf');

describe('csrfProtection', () => {
  const run = ({ method = 'POST', cookies = {}, header } = {}) => {
    const req = {
      method,
      cookies,
      get: jest.fn(() => header),
    };
    const next = jest.fn();
    csrfProtection(req, {}, next);
    return next;
  };

  it('allows safe methods without authentication cookies', () => {
    const next = run({ method: 'GET' });
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects state changes without a CSRF token', () => {
    const next = run({ cookies: { accessToken: 'access-token' } });
    expect(next.mock.calls[0][0]).toMatchObject({ code: 'CSRF_TOKEN_MISSING', statusCode: 403 });
  });

  it('allows a matching CSRF cookie and header', () => {
    const token = createCsrfToken();
    const next = run({ cookies: { accessToken: 'access-token', csrfToken: token }, header: token });
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a mismatched CSRF token', () => {
    const next = run({ cookies: { accessToken: 'access-token', csrfToken: createCsrfToken() }, header: 'wrong-token' });
    expect(next.mock.calls[0][0]).toMatchObject({ code: 'CSRF_TOKEN_INVALID', statusCode: 403 });
  });
});
