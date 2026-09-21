describe('CORS config', () => {
  it('allows the local Vite dev ports used by the frontend', () => {
    jest.resetModules();
    const env = require('../src/config/env');

    expect(env.cors.origins).toEqual(
      expect.arrayContaining([
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:4174',
        'http://127.0.0.1:4174',
      ])
    );
  });
});
