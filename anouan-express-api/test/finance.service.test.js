const db = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  withTransaction: jest.fn(),
}));

const financeService = require('../src/modules/finance/finance.service');

describe('finance.service.getAdminStats', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('uses the vendor validation status and exposes frontend-friendly finance totals', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total_orders: '120', total_revenue: '4500000' }] })
      .mockResolvedValueOnce({ rows: [{ count: '90' }] })
      .mockResolvedValueOnce({ rows: [{ count: '8' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ status: 'picked_up', count: '60' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ pending_payouts: '1800000', paid_payouts: '2700000' }],
      });

    const result = await financeService.getAdminStats({});

    const vendorQueryCall = db.query.mock.calls[2];
    expect(vendorQueryCall[0]).toContain('validation_status = \'approved\'');
    expect(result).toMatchObject({
      totalRevenue: 4500000,
      totalCommission: 450000,
      pendingPayouts: 1800000,
      paidPayouts: 2700000,
    });

    expect(db.query).toHaveBeenCalledTimes(8);
  });
});

describe('finance.service.rejectPayout', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('marks a pending payout as failed and stores the rejection reason', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ status: 'pending' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'payout-id', status: 'failed', notes: 'Informations incomplètes' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await financeService.rejectPayout('admin-id', 'payout-id', {
      reason: 'Informations incomplètes',
    });

    expect(result).toMatchObject({ id: 'payout-id', status: 'failed' });
    expect(db.query.mock.calls[1][0]).toContain("SET status = 'failed'");
    expect(db.query.mock.calls[1][1]).toEqual(['Informations incomplètes', 'payout-id']);
  });

  it('does not reject a payout that is no longer pending', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ status: 'paid' }] });

    await expect(
      financeService.rejectPayout('admin-id', 'payout-id', { reason: 'Erreur' })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(db.query).toHaveBeenCalledTimes(1);
  });
});

describe('finance.service.exportOrdersCSV', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('uses the current client and vendor relationships', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        order_id: 'order-id',
        client_name: 'Client Test',
        vendor_name: 'Boutique Test',
        product_title: 'Produit Test',
        quantity: 2,
        unit_price: 5000,
      }],
    });

    const result = await financeService.exportOrdersCSV({});
    const exportQuery = db.query.mock.calls[0][0];

    expect(exportQuery).toContain('o.client_id = c.id');
    expect(exportQuery).toContain('oi.vendor_id = v.id');
    expect(exportQuery).toContain('COALESCE(oi.title, p.title)');
    expect(result).toContain('Boutique Test');
  });
});

describe('finance.service.exportInventoryCSV', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('includes stock, valuation and health data for a vendor inventory export', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        product_id: 'prod-1',
        product_title: 'Produit Test',
        vendor_name: 'Boutique Test',
        category_name: 'Électronique',
        unit_price: '5000',
        current_stock: 3,
        inventory_valuation: '15000',
        product_status: 'active',
        stock_health: 'Stock critique',
        created_at: '2026-09-19T10:00:00.000Z',
      }],
    });

    const result = await financeService.exportInventoryCSV('vendor-1');
    const exportQuery = db.query.mock.calls[0][0];

    expect(exportQuery).toContain('p.vendor_id = $1');
    expect(exportQuery).toContain('current_stock');
    expect(result).toContain('Stock critique');
    expect(result).toContain('Produit Test');
  });
});
