const request = require('supertest');

// Mock auth middlewares to inject vendor user
jest.mock('../src/middlewares/authenticate', () => ({
  authenticate: (req, res, next) => { req.user = { vendorId: 'vendor-1' }; return next(); },
  authenticateOptional: (req, res, next) => next(),
}));

// Mock authorize to allow vendor
jest.mock('../src/middlewares/authorize', () => ({
  authorize: () => (req, res, next) => next(),
}));

// Mock upload to bypass Multer and attach fake files
jest.mock('../src/middlewares/upload', () => ({
  uploadProductImages: (req, res, next) => { req.files = [{ filename: 'fake.jpg' }]; return next(); },
  uploadAvatar: (req, res, next) => { req.file = { filename: 'avatar.jpg' }; return next(); },
  uploadBanner: (req, res, next) => { req.file = { filename: 'banner.jpg' }; return next(); },
  uploadLegalDoc: (req, res, next) => { req.file = { filename: 'doc.pdf' }; return next(); },
}));

// Mock DB to capture queries
jest.mock('../src/config/database', () => {
  return {
    query: jest.fn(),
    withTransaction: jest.fn(async (cb) => {
      const client = { query: jest.fn().mockResolvedValue({ rows: [{ id: 'prod-1' }] }) };
      return cb(client);
    })
    ,
    testConnection: jest.fn(async () => Promise.resolve()),
    pool: { on: () => {} }
  };
});

// require app after mocks so startup doesn't attempt real DB connections
const app = require('../src/app');

describe('POST /api/products', () => {
  it('creates a product when authenticated as vendor', async () => {
    const payload = {
      title: 'Integration T-Shirt',
      description: 'Test product',
      price: 2000,
      stock: 5,
      categoryId: '00000000-0000-0000-0000-000000000001'
    };

    const res = await request(app)
      .post('/api/products')
      .send(payload)
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('returns 422 when payload validation fails', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({})
      .set('Accept', 'application/json');

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('message');
  });

  it('returns 422 when flash sale is active without a price', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({
        title: 'Promo product',
        price: 1200,
        stock: 10,
        categoryId: '00000000-0000-0000-0000-000000000001',
        flashSaleActive: true
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.message).toMatch(/flashSalePrice/i);
  });
});
