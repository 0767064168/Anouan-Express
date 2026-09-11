const db = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const adminService = require('../src/modules/admin/admin.service');

describe('admin.service.getDashboardStats', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the dashboard metrics expected by the admin frontend', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ today_orders: 184, total_revenue: '15000000' }],
      })
      .mockResolvedValueOnce({
        rows: [{ active_vendors: 52 }],
      })
      .mockResolvedValueOnce({
        rows: [{ total_orders: 184 }],
      })
      .mockResolvedValueOnce({
        rows: [{ picked_up_orders: 176 }],
      })
      .mockResolvedValueOnce({
        rows: [{ month: '2026-09', revenue: '15000000', orders: 184 }],
      })
      .mockResolvedValueOnce({
        rows: [{ shop_name: 'Tech Store CI', orders: 12, revenue: '450000', rating: '4.8' }],
      });

    const result = await adminService.getDashboardStats();

    expect(result).toMatchObject({
      totalRevenue: 15000000,
      todayOrders: 184,
      activeVendors: 52,
      pickupRate: '95.7%',
      revenueByMonth: [{ month: '2026-09', revenue: 15000000, orders: 184 }],
      topVendors: [{ name: 'Tech Store CI', orders: 12, revenue: 450000, rating: 4.8 }],
    });
  });
});
