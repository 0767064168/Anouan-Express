const db = require('../src/config/database');
const productsController = require('../src/modules/products/products.controller');

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

describe('products.service.getVendorProducts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('filters the list by the authenticated vendor id', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await productsService.getVendorProducts('vendor-new', 1, 100);

    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(db.query.mock.calls[0][0]).toContain('p.vendor_id = $1');
    expect(db.query.mock.calls[0][1]).toEqual(['vendor-new', 100, 0]);
    expect(db.query.mock.calls[1][0]).toContain('p.vendor_id = $1');
    expect(db.query.mock.calls[1][1]).toEqual(['vendor-new', 100, 0]);
  });
});

describe('products.service.updateStock', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('reduces stock safely and marks the product as out of stock when the level hits zero', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'prod-1', title: 'Produit Test', stock: 0, status: 'out_of_stock', price: 5000 }],
    });

    const result = await productsService.updateStock('prod-1', 'vendor-1', -10, undefined, false);
    const updateQuery = db.query.mock.calls[0][0];

    expect(updateQuery).toContain('GREATEST(0, stock + $1)');
    expect(result).toMatchObject({ id: 'prod-1', stock: 0, status: 'out_of_stock' });
  });
});

describe('products.controller.create', () => {
  it('keeps all uploaded images by merging existing imageUrls with new uploaded files', async () => {
    const serviceSpy = jest.spyOn(require('../src/modules/products/products.service'), 'create').mockResolvedValue({ id: 'prod-2' });

    const req = {
      user: { vendorId: 'vendor-2' },
      body: { title: 'Produit multi-images', imageUrls: JSON.stringify(['/uploads/products/old-1.jpg', '/uploads/products/old-2.jpg']) },
      files: [{ filename: 'new-1.jpg' }, { filename: 'new-2.jpg' }],
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await productsController.create(req, res, next);

    expect(serviceSpy).toHaveBeenCalledWith('vendor-2', expect.objectContaining({
      imageUrls: ['/uploads/products/old-1.jpg', '/uploads/products/old-2.jpg', '/uploads/products/new-1.jpg', '/uploads/products/new-2.jpg'],
    }));
    expect(next).not.toHaveBeenCalled();

    serviceSpy.mockRestore();
  });
});
