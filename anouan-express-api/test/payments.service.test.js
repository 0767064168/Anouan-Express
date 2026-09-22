const crypto = require('crypto');
const db = require('../src/config/database');
const env = require('../src/config/env');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const paymentsService = require('../src/modules/payments/payments.service');
const { initiatePaymentSchema } = require('../src/modules/payments/payments.validation');

describe('payments contract', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('accepts a UUID order and a supported Mobile Money provider', () => {
    const result = initiatePaymentSchema.validate({
      orderId: '2944d613-f84c-44a3-a49c-5748298f33ac',
      phoneNumber: '+225 07 45 12 88',
      provider: 'orange',
    });

    expect(result.error).toBeUndefined();
  });

  it('returns payment status only for the owning client', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'pay_123', order_id: 'order-1', provider: 'wave', status: 'pending' }],
    });

    const result = await paymentsService.getPaymentStatus('pay_123', 'client-1');

    expect(result).toMatchObject({ id: 'pay_123', status: 'pending' });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('o.client_id = $2'), ['pay_123', 'client-1']);
  });

  it('rejects webhook requests when the signature is missing or invalid in production', async () => {
    env.app.env = 'production';
    env.payment.webhookSecret = 'webhook-secret';

    const payload = { cpm_trans_id: 'pay_123', cpm_result: '00' };
    const rawBody = JSON.stringify(payload);
    const validSignature = crypto.createHmac('sha256', 'webhook-secret').update(rawBody).digest('hex');

    await expect(
      paymentsService.handleWebhook(payload, { 'x-cinetpay-signature': 'wrong-signature' }, rawBody)
    ).rejects.toMatchObject({ code: 'WEBHOOK_SIGNATURE_INVALID' });

    await expect(
      paymentsService.handleWebhook(payload, { 'x-cinetpay-signature': validSignature }, rawBody)
    ).resolves.toMatchObject({ received: true });
  });

  it('rejects an unknown payment for the current client', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(
      paymentsService.getPaymentStatus('pay_missing', 'client-1')
    ).rejects.toMatchObject({ statusCode: 404, code: 'PAYMENT_NOT_FOUND' });
  });
});
