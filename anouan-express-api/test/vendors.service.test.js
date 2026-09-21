const db = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const vendorsService = require('../src/modules/vendors/vendors.service');

describe('vendors.service.getAllVendors', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the paginated vendor data expected by the admin page', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 'vendor-id',
          shop_name: 'Boutique Test',
          validation_status: 'approved',
          commission_rate: '10.00',
          owner_name: 'Vendeur Test',
          owner_email: 'vendeur@example.com',
          owner_phone: '+2250700000000',
          product_count: 4,
        }],
      });

    const result = await vendorsService.getAllVendors(1, 100, {});

    expect(result).toEqual({
      data: [{
        id: 'vendor-id',
        shop_name: 'Boutique Test',
        validation_status: 'approved',
        commission_rate: '10.00',
        owner_name: 'Vendeur Test',
        owner_email: 'vendeur@example.com',
        owner_phone: '+2250700000000',
        product_count: 4,
      }],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    expect(db.query).toHaveBeenCalledTimes(2);
  });
});

describe('vendors.service.getVendorStats', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns dashboard KPIs in the frontend contract', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        total_orders: 12,
        total_revenue: '450000',
        month_revenue: '120000',
        pending_orders: 3,
        commission_due: '45000',
        total_products: 8,
        active_products: 7,
        avg_rating: '4.75',
        review_count: 10,
      }],
    });

    await expect(vendorsService.getVendorStats('vendor-id')).resolves.toEqual({
      totalRevenue: 450000,
      monthRevenue: 120000,
      totalOrders: 12,
      pendingOrders: 3,
      totalProducts: 8,
      activeProducts: 7,
      commissionDue: 45000,
      avgRating: 4.75,
      reviewCount: 10,
    });
  });
});
