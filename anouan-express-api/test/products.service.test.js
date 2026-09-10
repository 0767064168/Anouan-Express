const db = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  withTransaction: jest.fn(),
}));

const productsService = require('../src/modules/products/products.service');

describe('products.service.create', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('inserts product, images and variants inside a transaction', async () => {
    const fakeClient = {
      query: jest.fn().mockImplementation(async (sql, params) => {
        if (sql.includes('SELECT id FROM vendors WHERE id = $1')) {
          return { rows: [{ id: 'vendor-1' }] };
        }
        if (sql.includes('SELECT id FROM categories')) {
          return { rows: [{ id: 'cat-1' }] };
        }
        if (sql.includes('INSERT INTO products')) {
          return { rows: [{ id: 'prod-1', title: params[2], slug: params[3], price: params[5], stock: params[6] }] };
        }
        return { rows: [] };
      })
    };

    db.withTransaction.mockImplementation(async (cb) => {
      return await cb(fakeClient);
    });

    const vendorId = 'vendor-1';
    const data = {
      title: 'T-shirt',
      description: 'Nice product',
      price: 1000,
      stock: 10,
      categoryId: 'cat-1',
      flashSaleActive: true,
      flashSalePrice: 750,
      imageUrls: ['/uploads/products/a.jpg', '/uploads/products/b.jpg'],
      variants: [{ name: 'Size L', sku: 'L1', priceModifier: 0, stock: 5 }]
    };

    const result = await productsService.create(vendorId, data);

    expect(db.withTransaction).toHaveBeenCalled();
    expect(fakeClient.query).toHaveBeenCalled();
    expect(result).toHaveProperty('id', 'prod-1');

    const productInsertCall = fakeClient.query.mock.calls.find(call => call[0].includes('INSERT INTO products'));
    expect(productInsertCall).toBeDefined();
    expect(productInsertCall[1]).toEqual([
      vendorId,
      data.categoryId,
      data.title,
      expect.any(String),
      data.description,
      data.price,
      data.stock,
      true,
      data.flashSalePrice,
    ]);

    const imageInsertCalled = fakeClient.query.mock.calls.some(call => /INSERT INTO product_images/.test(call[0]));
    expect(imageInsertCalled).toBe(true);

    const variantInsertCalled = fakeClient.query.mock.calls.some(call => /INSERT INTO product_variants/.test(call[0]));
    expect(variantInsertCalled).toBe(true);
  });
});
