const smsService = require('../src/utils/smsService');

describe('smsService compatibility helpers', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts the legacy direct order id signature for vendor alerts', async () => {
    const spy = jest.spyOn(smsService, 'sendSMS').mockResolvedValue({ simulated: true });

    await smsService.smsNewOrder('+2250700000000', 'abc12345');

    expect(spy).toHaveBeenCalledWith(
      '+2250700000000',
      expect.stringContaining('ABC12345')
    );
  });

  it('accepts the payload object signature for agent alerts', async () => {
    const spy = jest.spyOn(smsService, 'sendSMS').mockResolvedValue({ simulated: true });

    await smsService.smsNewOrderAgent('+2250700000000', {
      orderId: 'abc12345',
      storeName: 'Bouaké Central',
      itemsCount: 3,
    });

    expect(spy).toHaveBeenCalledWith(
      '+2250700000000',
      expect.stringContaining('Bouaké Central')
    );
  });
});
