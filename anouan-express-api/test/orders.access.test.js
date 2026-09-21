const db = require('../src/config/database');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  withTransaction: jest.fn(),
}));

const ordersService = require('../src/modules/orders/orders.service');

describe('orders.service Agent store access', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects an Agent reading an order from another store', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 'order-id',
        store_id: 'store-b',
        client_id: 'client-id',
        items: [],
      }],
    });

    await expect(
      ordersService.getOrderById('order-id', {
        id: 'agent-id',
        role: 'agent',
        store_id: 'store-a',
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      code: 'WRONG_STORE',
    });
  });
});