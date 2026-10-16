const request = require('supertest');

describe('Vercel Supabase Storage uploads', () => {
  const originalEnv = {};
  const envKeys = ['VERCEL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_STORAGE_BUCKET'];
  let originalFetch;

  beforeAll(() => {
    envKeys.forEach((key) => {
      originalEnv[key] = process.env[key];
    });
    process.env.VERCEL = '1';
    process.env.SUPABASE_URL = 'https://storage.example.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.SUPABASE_STORAGE_BUCKET = 'test-uploads';
    originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
  });

  afterAll(() => {
    envKeys.forEach((key) => {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    });
    global.fetch = originalFetch;
  });

  it('uploads files from memory to the configured Supabase bucket', async () => {
    let app;
    jest.isolateModules(() => {
      const express = require('express');
      const { uploadAvatar } = require('../src/middlewares/upload');
      app = express();
      app.post('/upload', uploadAvatar, (req, res) => {
        res.status(201).json({ filename: req.file.filename });
      });
    });

    const response = await request(app)
      .post('/upload')
      .attach('avatar', Buffer.from('image-bytes'), { filename: 'avatar.png', contentType: 'image/png' });

    expect(response.status).toBe(201);
    expect(response.body.filename).toMatch(/^[0-9a-f-]+\.png$/i);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/storage\.example\.test\/storage\/v1\/object\/test-uploads\/avatars\//),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('redirects stored files to a temporary signed Supabase URL', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ signedURL: '/object/sign/test-uploads/products/photo.webp?token=signed' }),
    });

    let app;
    jest.isolateModules(() => {
      jest.doMock('../src/config/database', () => ({
        query: jest.fn(),
        withTransaction: jest.fn(),
        testConnection: jest.fn(),
        pool: { on: jest.fn() },
      }));
      app = require('../src/app');
    });

    const response = await request(app).get('/uploads/products/photo.webp');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      'https://storage.example.test/object/sign/test-uploads/products/photo.webp?token=signed'
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://storage.example.test/storage/v1/object/sign/test-uploads/products/photo.webp',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
