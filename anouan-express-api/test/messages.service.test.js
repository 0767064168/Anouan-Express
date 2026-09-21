jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../src/config/socket', () => ({
  emitToUser: jest.fn(),
}));

jest.mock('../src/config/firebase', () => ({
  sendPushNotification: jest.fn().mockResolvedValue(undefined),
}));

const { query } = require('../src/config/database');
const messagesService = require('../src/modules/messages/messages.service');

describe('messages.service.sendMessage', () => {
  beforeEach(() => {
    query.mockReset();
  });

  it('persists an image attachment with a text message', async () => {
    const message = {
      id: 'message-1',
      sender_id: 'sender-1',
      recipient_id: 'recipient-1',
      content: 'Voici la photo du produit',
      attachment_url: '/uploads/messages/photo.jpg',
      attachment_type: 'image/jpeg',
      attachment_name: 'photo.jpg',
    };
    query
      .mockResolvedValueOnce({ rows: [message] })
      .mockResolvedValueOnce({ rows: [{ fcm_token: null, name: 'Client' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Vendeur' }] });

    const result = await messagesService.sendMessage('sender-1', {
      recipientId: 'recipient-1',
      content: 'Voici la photo du produit',
      attachmentUrl: '/uploads/messages/photo.jpg',
      attachmentType: 'image/jpeg',
      attachmentName: 'photo.jpg',
    });

    expect(result).toEqual(message);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('attachment_url'),
      expect.arrayContaining([
        'sender-1',
        'recipient-1',
        'Voici la photo du produit',
        '/uploads/messages/photo.jpg',
        'image/jpeg',
        'photo.jpg',
      ])
    );
  });
});
