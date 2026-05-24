import { TestBed } from '@angular/core/testing';

import { ClerkService } from '@app/services/clerk.service';

import { ApiError, ApiService } from './api.service';

jest.mock('@env', () => ({
  environment: {
    production: false,
    clerkPublishableKey: 'test-key',
    apiUrl: 'http://localhost:3000/api',
    preview: null,
  },
}));

type MockClerkService = {
  getToken: jest.Mock<Promise<string | null>>;
};

describe('ApiService', () => {
  let service: ApiService;
  let mockClerk: MockClerkService;

  beforeEach(() => {
    mockClerk = {
      getToken: jest.fn().mockResolvedValue('test-token'),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ClerkService, useValue: mockClerk }],
    });

    service = TestBed.inject(ApiService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function mockFetchResponse(body: unknown, status = 200): void {
    const isEmpty = status === 204 || body === undefined;
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(body),
      text: jest.fn().mockResolvedValue(isEmpty ? '' : JSON.stringify(body)),
    });
  }

  function mockFetchError(status: number, errorBody?: { error: string }): void {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status,
      json: jest.fn().mockResolvedValue(errorBody ?? null),
    });
  }

  // ---------------------------------------------------------------------------
  // Authorization header
  // ---------------------------------------------------------------------------

  describe('authorization', () => {
    it('adds Bearer token to requests when token is available', async () => {
      mockFetchResponse({ data: 'test' });

      await service.get('/test');

      const call = (globalThis.fetch as jest.Mock).mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('does not add Authorization header when token is null', async () => {
      mockClerk.getToken.mockResolvedValue(null);
      mockFetchResponse({ data: 'test' });

      await service.get('/test');

      const call = (globalThis.fetch as jest.Mock).mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.has('Authorization')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // GET
  // ---------------------------------------------------------------------------

  describe('get', () => {
    it('makes a GET request to the correct URL', async () => {
      mockFetchResponse({ items: [] });

      const result = await service.get<{ items: string[] }>('/users');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/users',
        expect.objectContaining({ cache: 'no-store' }),
      );
      expect(result).toEqual({ items: [] });
    });
  });

  // ---------------------------------------------------------------------------
  // POST
  // ---------------------------------------------------------------------------

  describe('post', () => {
    it('makes a POST request with body', async () => {
      const formData = new FormData();
      mockFetchResponse({ id: '1' });

      await service.post('/upload', formData);

      const call = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('POST');
      expect(call[1].body).toBe(formData);
    });

    it('makes a POST request without body', async () => {
      mockFetchResponse({ ok: true });

      await service.post('/action');

      const call = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('POST');
      expect(call[1].body).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // PUT
  // ---------------------------------------------------------------------------

  describe('put', () => {
    it('makes a PUT request with JSON body', async () => {
      mockFetchResponse({ updated: true });

      await service.put('/users/1', { name: 'John' });

      const call = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('PUT');
      expect(call[1].body).toBe(JSON.stringify({ name: 'John' }));
      const headers = call[1].headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH
  // ---------------------------------------------------------------------------

  describe('patch', () => {
    it('makes a PATCH request with JSON body', async () => {
      mockFetchResponse({ updated: true });

      await service.patch('/users/1', { name: 'Jane' });

      const call = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('PATCH');
      expect(call[1].body).toBe(JSON.stringify({ name: 'Jane' }));
      const headers = call[1].headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------

  describe('delete', () => {
    it('makes a DELETE request', async () => {
      mockFetchResponse({ deleted: true });

      await service.delete('/users/1');

      const call = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(call[1].method).toBe('DELETE');
    });
  });

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('throws ApiError with server error message', async () => {
      mockFetchError(400, { error: 'Bad request' });

      await expect(service.get('/bad')).rejects.toThrow(ApiError);
      await expect(service.get('/bad')).rejects.toThrow('Bad request');
    });

    it('throws ApiError with status code', async () => {
      mockFetchError(404, { error: 'Not found' });

      try {
        await service.get('/missing');
        fail('Expected ApiError');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(404);
      }
    });

    it('throws ApiError with fallback message when response has no JSON error', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('no json')),
      });

      await expect(service.get('/fail')).rejects.toThrow('Request failed (500)');
    });
  });

  // ---------------------------------------------------------------------------
  // ApiError class
  // ---------------------------------------------------------------------------

  describe('ApiError', () => {
    it('is an instance of Error with a status property', () => {
      const error = new ApiError('test message', 422);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('test message');
      expect(error.status).toBe(422);
    });
  });
});
