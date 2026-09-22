const db = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const adminService = require('../src/modules/admin/admin.service');

jest.mock('../src/middlewares/auditLog', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
}));

describe('admin.service.getDashboardStats', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    db.query.mockResolvedValue({ rows: [] });
  });

  it('returns the dashboard metrics expected by the admin frontend', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ all_time_revenue: '15000000' }],
      })
      .mockResolvedValueOnce({
        rows: [{ today_orders: 184, today_revenue: '500000' }],
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
        rows: [{ total_clients: 80, new_clients_month: 12 }],
      })
      .mockResolvedValueOnce({
        rows: [{ status: 'ready_for_pickup', count: 10 }],
      })
      .mockResolvedValueOnce({
        rows: [{ month: '2026-09', revenue: '15000000', orders: 184 }],
      })
      .mockResolvedValueOnce({
        rows: [{ shop_name: 'Tech Store CI', orders: 12, revenue: '450000', rating: '4.8' }],
      })
      .mockResolvedValueOnce({
        rows: [{ title: 'Smartphone Pro', sales_count: 8, revenue: '1200000' }],
      });

    const result = await adminService.getDashboardStats();

    expect(result).toMatchObject({
      totalRevenue: 15000000,
      todayOrders: 184,
      todayRevenue: 500000,
      activeVendors: 52,
      totalOrders: 184,
      totalClients: 80,
      newClientsThisMonth: 12,
      pickupRate: '95.7%',
      revenueByMonth: [{ month: '2026-09', revenue: 15000000, orders: 184 }],
      topVendors: [{ name: 'Tech Store CI', orders: 12, revenue: 450000, rating: 4.8 }],
      topProducts: [{ name: 'Smartphone Pro', sales: 8, revenue: 1200000 }],
    });
  });
});

describe('admin.service.getWeeklyReport', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns rich KPI and comparison data for the selected week', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-23T12:00:00Z'));

    db.query
      .mockResolvedValueOnce({
        rows: [
          { day_num: 1, day_date: '2026-09-21', orders_count: '5', revenue: '175000' },
          { day_num: 2, day_date: '2026-09-22', orders_count: '4', revenue: '260000' },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{
          total_orders: '9',
          total_revenue: '435000',
          completed_orders: '7',
          picked_up: '6',
          cancelled: '2',
          cash_orders: '3',
          mobile_orders: '6',
          cash_revenue: '90000',
          mobile_revenue: '345000',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          total_orders: '7',
          total_revenue: '320000',
          completed_orders: '5',
          picked_up: '4',
          cancelled: '1',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{ shop_name: 'Boutique A', vendor_name: 'Moussa', order_count: '4', revenue: '220000' }],
      })
      .mockResolvedValueOnce({
        rows: [{ title: 'Produit X', qty_sold: '9', revenue: '180000' }],
      });

    const result = await adminService.getWeeklyReport(0);

    expect(result.week.start).toBe('2026-09-21');
    expect(result.kpi.total_orders).toBe(9);
    expect(result.kpi.completed_orders).toBe(7);
    expect(result.kpi.cancel_rate).toBe(22);
    expect(result.kpi.avg_order_value).toBe(48333);
    expect(result.vs_prev.orders_pct).toBe(29);
    expect(result.vs_prev.revenue_pct).toBe(36);
    expect(result.daily[0]).toMatchObject({ label: 'Lun', orders: 5, revenue: 175000, completed_orders: 0, cancelled_orders: 0 });
    expect(result.summary.best_day).toMatchObject({ label: 'Mar', orders: 4, revenue: 260000 });
    expect(result.top_vendors[0]).toMatchObject({ name: 'Boutique A', order_count: 4, revenue: 220000 });
    expect(db.query.mock.calls[3][0]).toContain('v.shop_name');

    jest.useRealTimers();
  });
});

describe('admin.service.createAgent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates an active agent with a hashed password and never returns the hash', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'store-id', name: 'Relais Central', city: 'Bouaké' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 'agent-id', name: 'Agent Test', email: 'agent@example.com', phone: '0700000000', role: 'agent', status: 'active' }],
      });

    const result = await adminService.createAgent('admin-id', {
      name: ' Agent Test ',
      email: 'Agent@Example.com',
      phone: '0700000000',
      password: 'secret123',
      storeId: 'store-id',
    });

    expect(result).toMatchObject({ id: 'agent-id', role: 'agent', status: 'active' });
    expect(result.password_hash).toBeUndefined();
    expect(db.query).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO users (name, email, phone, password_hash, role, status, store_id)"),
      ['Agent Test', 'agent@example.com', '0700000000', expect.any(String), 'store-id']
    );
  });
});

describe('admin.service.createAdmin', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates an admin account with a hashed password and the admin role', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 'admin-id-2', name: 'Super Admin', email: 'superadmin@example.com', phone: '0700000001', role: 'admin', status: 'active' }],
      });

    const result = await adminService.createAdmin('admin-id', {
      name: ' Super Admin ',
      email: 'SuperAdmin@Example.com',
      phone: '0700000001',
      password: 'secret123',
    });

    expect(result).toMatchObject({ id: 'admin-id-2', role: 'admin', status: 'active' });
    expect(result.password_hash).toBeUndefined();
    expect(db.query).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO users (name, email, phone, password_hash, role, status)"),
      ['Super Admin', 'superadmin@example.com', '0700000001', expect.any(String)]
    );
  });
});

describe('admin.service.assignAgentStore', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('assigns an agent to an active store and returns its city', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'store-id', name: 'Relais Central', city: 'Bouaké' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'agent-id', name: 'Agent Test', role: 'agent', store_id: 'store-id' }] });

    const result = await adminService.assignAgentStore('admin-id', 'agent-id', 'store-id');

    expect(result).toMatchObject({
      id: 'agent-id',
      store_id: 'store-id',
      store_name: 'Relais Central',
      store_city: 'Bouaké',
    });
  });
});

describe('admin.service.updateAgent', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('updates agent identity and assignment using an active store', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'store-id', name: 'Relais Central', city: 'Bouaké' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'agent-id', name: 'Agent Nouveau', phone: '0700000000', role: 'agent', store_id: 'store-id' }] });

    const result = await adminService.updateAgent('admin-id', 'agent-id', {
      name: ' Agent Nouveau ',
      phone: '0700000000',
      storeId: 'store-id',
    });

    expect(result).toMatchObject({
      id: 'agent-id',
      name: 'Agent Nouveau',
      store_name: 'Relais Central',
      store_city: 'Bouaké',
    });
  });
});
