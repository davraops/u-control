const { handler } = require('../incomes');

describe('Incomes Handler', () => {
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

  describe('GET /incomes', () => {
    it('should return all incomes', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      
      // Check first income structure
      const firstIncome = body[0];
      expect(firstIncome).toHaveProperty('id');
      expect(firstIncome).toHaveProperty('amount');
      expect(firstIncome).toHaveProperty('currency');
      expect(firstIncome).toHaveProperty('description');
      expect(firstIncome).toHaveProperty('category');
      expect(firstIncome).toHaveProperty('accountId');
      expect(firstIncome).toHaveProperty('date');
    });

    it('should filter incomes by accountId', async () => {
      mockEvent.queryStringParameters = { accountId: 'test-account-1' };
      
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      body.forEach(income => {
        expect(income.accountId).toBe('test-account-1');
      });
    });
  });

  describe('POST /incomes', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'POST';
      mockEvent.body = JSON.stringify({
        amount: 2000000,
        currency: 'COP',
        description: 'Test Income',
        category: 'salario',
        accountId: 'test-account-1',
        date: '2024-01-15'
      });
    });

    it('should create a new income', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(201);
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('id');
      expect(body.amount).toBe(2000000);
      expect(body.currency).toBe('COP');
      expect(body.description).toBe('Test Income');
      expect(body.category).toBe('salario');
      expect(body.accountId).toBe('test-account-1');
      expect(body.date).toBe('2024-01-15');
    });

    it('should return 400 for invalid data', async () => {
      mockEvent.body = JSON.stringify({
        amount: -1000, // Invalid: negative amount
        currency: 'COP',
        description: 'Test Income',
        category: 'salario',
        accountId: 'test-account-1',
        date: '2024-01-15'
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('errors');
      expect(Array.isArray(body.errors)).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      mockEvent.body = JSON.stringify({
        amount: 2000000,
        currency: 'COP'
        // Missing required fields
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('errors');
      expect(body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /incomes/{id}', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'PUT';
      mockEvent.pathParameters = { id: 'test-income-1' };
      mockEvent.body = JSON.stringify({
        amount: 3000000,
        currency: 'COP',
        description: 'Updated Income',
        category: 'freelance',
        accountId: 'test-account-1',
        date: '2024-01-20'
      });
    });

    it('should update an existing income', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.amount).toBe(3000000);
      expect(body.description).toBe('Updated Income');
      expect(body.category).toBe('freelance');
    });

    it('should return 404 for non-existent income', async () => {
      mockEvent.pathParameters = { id: 'non-existent-id' };

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(404);
    });
  });

  describe('DELETE /incomes/{id}', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'DELETE';
      mockEvent.pathParameters = { id: 'test-income-1' };
    });

    it('should delete an existing income', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.message).toContain('eliminado');
    });

    it('should return 404 for non-existent income', async () => {
      mockEvent.pathParameters = { id: 'non-existent-id' };

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(404);
    });
  });

  describe('Validation', () => {
    it('should validate currency format', async () => {
      mockEvent.httpMethod = 'POST';
      mockEvent.body = JSON.stringify({
        amount: 2000000,
        currency: 'INVALID', // Invalid currency
        description: 'Test Income',
        category: 'salario',
        accountId: 'test-account-1',
        date: '2024-01-15'
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.errors).toContain('La moneda debe ser un código de 3 letras (ej: COP, USD)');
    });

    it('should validate date format', async () => {
      mockEvent.httpMethod = 'POST';
      mockEvent.body = JSON.stringify({
        amount: 2000000,
        currency: 'COP',
        description: 'Test Income',
        category: 'salario',
        accountId: 'test-account-1',
        date: 'invalid-date' // Invalid date format
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.errors).toContain('La fecha es requerida y debe estar en formato YYYY-MM-DD');
    });
  });
});
