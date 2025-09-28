const { handler } = require('../accounts');

describe('Accounts Handler', () => {
  let mockEvent;

  beforeEach(() => {
    mockEvent = {
      httpMethod: 'GET',
      pathParameters: null,
      queryStringParameters: null,
      body: null,
      headers: {}
    };
  });

  describe('GET /accounts', () => {
    it('should return all accounts', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      
      // Check first account structure
      const firstAccount = body[0];
      expect(firstAccount).toHaveProperty('id');
      expect(firstAccount).toHaveProperty('name');
      expect(firstAccount).toHaveProperty('type');
      expect(firstAccount).toHaveProperty('balance');
      expect(firstAccount).toHaveProperty('currency');
    });
  });

  describe('POST /accounts', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'POST';
      mockEvent.body = JSON.stringify({
        name: 'Test Account',
        type: 'checking',
        balance: 1000000,
        currency: 'COP'
      });
    });

    it('should create a new account', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(201);
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('id');
      expect(body.name).toBe('Test Account');
      expect(body.type).toBe('checking');
      expect(body.balance).toBe(1000000);
      expect(body.currency).toBe('COP');
    });

    it('should return 400 for invalid data', async () => {
      mockEvent.body = JSON.stringify({
        name: '', // Invalid: empty name
        type: 'checking',
        balance: 1000000,
        currency: 'COP'
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('errors');
      expect(Array.isArray(body.errors)).toBe(true);
    });
  });

  describe('PUT /accounts/{id}', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'PUT';
      mockEvent.pathParameters = { id: 'test-account-1' };
      mockEvent.body = JSON.stringify({
        name: 'Updated Account',
        type: 'savings',
        balance: 2000000,
        currency: 'COP'
      });
    });

    it('should update an existing account', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.name).toBe('Updated Account');
      expect(body.type).toBe('savings');
      expect(body.balance).toBe(2000000);
    });

    it('should return 404 for non-existent account', async () => {
      mockEvent.pathParameters = { id: 'non-existent-id' };

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(404);
    });
  });

  describe('DELETE /accounts/{id}', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'DELETE';
      mockEvent.pathParameters = { id: 'test-account-1' };
    });

    it('should delete an existing account', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.message).toContain('eliminada');
    });

    it('should return 404 for non-existent account', async () => {
      mockEvent.pathParameters = { id: 'non-existent-id' };

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(404);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in all responses', async () => {
      const result = await handler(mockEvent);
      
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Headers');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
    });
  });
});
