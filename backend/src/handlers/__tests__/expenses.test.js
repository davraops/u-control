const { handler } = require('../expenses');

describe('Expenses Handler', () => {
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

  describe('GET /expenses', () => {
    it('should return all expenses', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      
      // Check first expense structure
      const firstExpense = body[0];
      expect(firstExpense).toHaveProperty('id');
      expect(firstExpense).toHaveProperty('amount');
      expect(firstExpense).toHaveProperty('currency');
      expect(firstExpense).toHaveProperty('description');
      expect(firstExpense).toHaveProperty('category');
      expect(firstExpense).toHaveProperty('accountId');
      expect(firstExpense).toHaveProperty('date');
    });

    it('should filter expenses by accountId', async () => {
      mockEvent.queryStringParameters = { accountId: 'test-account-1' };
      
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      body.forEach(expense => {
        expect(expense.accountId).toBe('test-account-1');
      });
    });

    it('should filter expenses by budgetId', async () => {
      mockEvent.queryStringParameters = { budgetId: 'test-budget-1' };
      
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      body.forEach(expense => {
        expect(expense.budgetId).toBe('test-budget-1');
      });
    });
  });

  describe('POST /expenses', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'POST';
      mockEvent.body = JSON.stringify({
        amount: 50000,
        currency: 'COP',
        description: 'Test Expense',
        category: 'alimentacion',
        accountId: 'test-account-1',
        date: '2024-01-15'
      });
    });

    it('should create a new expense', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(201);
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('id');
      expect(body.amount).toBe(50000);
      expect(body.currency).toBe('COP');
      expect(body.description).toBe('Test Expense');
      expect(body.category).toBe('alimentacion');
      expect(body.accountId).toBe('test-account-1');
      expect(body.date).toBe('2024-01-15');
    });

    it('should create expense without budgetId (optional)', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(201);
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('id');
      expect(body.budgetId).toBeUndefined();
    });

    it('should return 400 for invalid data', async () => {
      mockEvent.body = JSON.stringify({
        amount: -1000, // Invalid: negative amount
        currency: 'COP',
        description: 'Test Expense',
        category: 'alimentacion',
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
        amount: 50000,
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

  describe('PUT /expenses/{id}', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'PUT';
      mockEvent.pathParameters = { id: 'test-expense-1' };
      mockEvent.body = JSON.stringify({
        amount: 75000,
        currency: 'COP',
        description: 'Updated Expense',
        category: 'transporte',
        accountId: 'test-account-1',
        date: '2024-01-20'
      });
    });

    it('should update an existing expense', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.amount).toBe(75000);
      expect(body.description).toBe('Updated Expense');
      expect(body.category).toBe('transporte');
    });

    it('should return 404 for non-existent expense', async () => {
      mockEvent.pathParameters = { id: 'non-existent-id' };

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(404);
    });
  });

  describe('DELETE /expenses/{id}', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'DELETE';
      mockEvent.pathParameters = { id: 'test-expense-1' };
    });

    it('should delete an existing expense', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.message).toContain('eliminado');
    });

    it('should return 404 for non-existent expense', async () => {
      mockEvent.pathParameters = { id: 'non-existent-id' };

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(404);
    });
  });

  describe('Validation', () => {
    it('should validate category against budget categories', async () => {
      mockEvent.httpMethod = 'POST';
      mockEvent.body = JSON.stringify({
        amount: 50000,
        currency: 'COP',
        description: 'Test Expense',
        category: 'invalid-category', // Invalid category
        accountId: 'test-account-1',
        date: '2024-01-15'
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.errors).toContain('La categoría debe ser una de las categorías de presupuesto válidas');
    });

    it('should validate currency format', async () => {
      mockEvent.httpMethod = 'POST';
      mockEvent.body = JSON.stringify({
        amount: 50000,
        currency: 'INVALID', // Invalid currency
        description: 'Test Expense',
        category: 'alimentacion',
        accountId: 'test-account-1',
        date: '2024-01-15'
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.errors).toContain('La moneda debe ser un código de 3 letras (ej: COP, USD)');
    });
  });
});
