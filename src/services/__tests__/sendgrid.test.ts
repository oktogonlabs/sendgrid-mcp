import { jest } from '@jest/globals';
import { SendGridService } from '../sendgrid.js';

// Integration tests require a real API key
const apiKey = process.env.SENDGRID_API_KEY;
const describeIfApiKey = apiKey ? describe : describe.skip;

describe('SendGridService', () => {
  describe('Unit Tests', () => {
    let service: SendGridService;
    let mockClient: any;

    beforeEach(() => {
      service = new SendGridService('SG.test-key');
      mockClient = {
        request: jest.fn(),
        setApiKey: jest.fn(),
      };
      // Replace the private client with our mock
      (service as any).client = mockClient;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('getBounce', () => {
      it('returns bounce details when suppression exists', async () => {
        const mockBounce = {
          email: 'bounce@example.com',
          created: 1609459200,
          reason: '554 5.4.7 [internal] exceeded storage allocation',
          status: '5.4.7',
        };

        mockClient.request.mockResolvedValue([{ body: mockBounce }]);

        const result = await service.getBounce('bounce@example.com');

        expect(result).toEqual(mockBounce);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/v3/suppression/bounces/bounce%40example.com',
        });
      });

      it('handles empty array response (suppressed but no details)', async () => {
        mockClient.request.mockResolvedValue([{ body: [] }]);

        const result = await service.getBounce('suppressed@example.com');

        expect(result).toEqual({ email: 'suppressed@example.com' });
      });

      it('handles array response with single element', async () => {
        const mockBounce = { email: 'bounce@example.com', status: '5.4.7' };
        mockClient.request.mockResolvedValue([{ body: [mockBounce] }]);

        const result = await service.getBounce('bounce@example.com');

        expect(result).toEqual(mockBounce);
      });

      it('returns null when email is not suppressed (404)', async () => {
        const error = { response: { statusCode: 404 } };
        mockClient.request.mockRejectedValue(error);

        const result = await service.getBounce('missing@example.com');

        expect(result).toBeNull();
      });

      it('rethrows non-404 errors', async () => {
        const error = new Error('network error');
        mockClient.request.mockRejectedValue(error);

        await expect(service.getBounce('error@example.com')).rejects.toThrow(
          'network error'
        );
      });
    });

    describe('getBlock', () => {
      it('returns block details when suppression exists', async () => {
        const mockBlock = {
          email: 'blocked@example.com',
          created: 1609459200,
          reason: 'Spam complaint',
          status: 'spam',
        };

        mockClient.request.mockResolvedValue([{ body: mockBlock }]);

        const result = await service.getBlock('blocked@example.com');

        expect(result).toEqual(mockBlock);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/v3/suppression/blocks/blocked%40example.com',
        });
      });

      it('returns null when email is not suppressed (404)', async () => {
        const error = { response: { statusCode: 404 } };
        mockClient.request.mockRejectedValue(error);

        const result = await service.getBlock('missing@example.com');

        expect(result).toBeNull();
      });
    });

    describe('getStats', () => {
      it('calls the stats endpoint with correct parameters', async () => {
        const mockStats = [{ date: '2024-01-01', stats: [] }];
        mockClient.request.mockResolvedValue([{ body: mockStats }]);

        const result = await service.getStats({
          start_date: '2024-01-01',
          end_date: '2024-01-07',
          aggregated_by: 'day',
        });

        expect(result).toEqual(mockStats);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/v3/stats',
          qs: {
            start_date: '2024-01-01',
            end_date: '2024-01-07',
            aggregated_by: 'day',
          },
        });
      });
    });

    describe('getEmailActivity', () => {
      it('calls the messages endpoint with query string', async () => {
        const mockResponse = { messages: [] };
        mockClient.request.mockResolvedValue([{ body: mockResponse }]);

        const result = await service.getEmailActivity('to_email="test@example.com"');

        expect(result).toEqual(mockResponse);
        expect(mockClient.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/v3/messages',
          qs: { query: 'to_email="test@example.com"' },
        });
      });
    });
  });

  describeIfApiKey('Integration Tests', () => {
    let service: SendGridService;

    beforeAll(() => {
      service = new SendGridService(apiKey!);
    });

    jest.setTimeout(30000);

    it('retrieves email statistics', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const stats = await service.getStats({
        start_date: startDate.toISOString().split('T')[0],
        aggregated_by: 'day',
      });

      expect(Array.isArray(stats)).toBe(true);
    });

    it('fetches email activity', async () => {
      const activity = await service.getEmailActivity('to_email="nonexistent@example.com"');
      expect(activity).toBeDefined();
      expect(Array.isArray(activity.messages)).toBe(true);
    });
  });
});
