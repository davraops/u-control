const { handler } = require('../budgets');

describe('Budgets Handler', () => {
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

  describe('GET /budgets', () => {
    it('should return all budgets', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      
      // Check first budget structure
      const firstBudget = body[0];
      expect(firstBudget).toHaveProperty('id');
      expect(firstBudget).toHaveProperty('month');
      expect(firstBudget).toHaveProperty('year');
      expect(firstBudget).toHaveProperty('categories');
      expect(firstBudget).toHaveProperty('totalBudgeted');
      expect(firstBudget).toHaveProperty('status');
      expect(Array.isArray(firstBudget.categories)).toBe(true);
    });

    it('should filter budgets by month', async () => {
      mockEvent.queryStringParameters = { month: '2024-01' };
      
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      body.forEach(budget => {
        expect(budget.month).toBe('2024-01');
      });
    });

    it('should filter budgets by status', async () => {
      mockEvent.queryStringParameters = { status: 'active' };
      
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      body.forEach(budget => {
        expect(budget.status).toBe('active');
      });
    });
  });

  describe('POST /budgets', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'POST';
      mockEvent.body = JSON.stringify({
        month: '2024-02',
        year: 2024,
        categories: [
          {
            category: 'alimentacion',
            budgeted: 500000
          },
          {
            category: 'transporte',
            budgeted: 200000
          }
        ],
        totalBudgeted: 700000,
        status: 'draft'
      });
    });

    it('should create a new budget', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(201);
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('id');
      expect(body.month).toBe('2024-02');
      expect(body.year).toBe(2024);
      expect(body.categories).toHaveLength(2);
      expect(body.totalBudgeted).toBe(700000);
      expect(body.status).toBe('draft');
    });

    it('should return 400 for invalid month format', async () => {
      mockEvent.body = JSON.stringify({
        month: 'invalid-month', // Invalid format
        year: 2024,
        categories: [
          {
            category: 'alimentacion',
            budgeted: 500000
          }
        ],
        totalBudgeted: 500000,
        status: 'draft'
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.errors).toContain('El mes debe estar en formato YYYY-MM (ej: 2024-01)');
    });

    it('should return 400 for missing categories', async () => {
      mockEvent.body = JSON.stringify({
        month: '2024-02',
        year: 2024,
        categories: [], // Empty categories
        totalBudgeted: 500000,
        status: 'draft'
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.errors).toContain('Debe incluir al menos una categoría de presupuesto');
    });

    it('should return 400 for invalid year', async () => {
      mockEvent.body = JSON.stringify({
        month: '2024-02',
        year: 2019, // Invalid year (too old)
        categories: [
          {
            category: 'alimentacion',
            budgeted: 500000
          }
        ],
        totalBudgeted: 500000,
        status: 'draft'
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.errors).toContain('El año debe estar entre 2020 y 2030');
    });

    it('should return 400 for invalid status', async () => {
      mockEvent.body = JSON.stringify({
        month: '2024-02',
        year: 2024,
        categories: [
          {
            category: 'alimentacion',
            budgeted: 500000
          }
        ],
        totalBudgeted: 500000,
        status: 'invalid-status' // Invalid status
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.errors).toContain('El estado debe ser: draft, active, o completed');
    });
  });

  describe('PUT /budgets/{id}', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'PUT';
      mockEvent.pathParameters = { id: 'test-budget-1' };
      mockEvent.body = JSON.stringify({
        month: '2024-01',
        year: 2024,
        categories: [
          {
            category: 'alimentacion',
            budgeted: 600000
          }
        ],
        totalBudgeted: 600000,
        status: 'active'
      });
    });

    it('should update an existing budget', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.categories[0].budgeted).toBe(600000);
      expect(body.totalBudgeted).toBe(600000);
      expect(body.status).toBe('active');
    });

    it('should return 404 for non-existent budget', async () => {
      mockEvent.pathParameters = { id: 'non-existent-id' };

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(404);
    });
  });

  describe('DELETE /budgets/{id}', () => {
    beforeEach(() => {
      mockEvent.httpMethod = 'DELETE';
      mockEvent.pathParameters = { id: 'test-budget-1' };
    });

    it('should delete an existing budget', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.message).toContain('eliminado');
    });

    it('should return 404 for non-existent budget', async () => {
      mockEvent.pathParameters = { id: 'non-existent-id' };

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(404);
    });
  });

  describe('Category Validation', () => {
    it('should validate category budgeted amount', async () => {
      mockEvent.httpMethod = 'POST';
      mockEvent.body = JSON.stringify({
        month: '2024-02',
        year: 2024,
        categories: [
          {
            category: 'alimentacion',
            budgeted: -1000 // Invalid: negative amount
          }
        ],
        totalBudgeted: -1000,
        status: 'draft'
      });

      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      
      const body = JSON.parse(result.body);
      expect(body.errors).toContain('El presupuesto para la categoría alimentacion debe ser mayor o igual a 0');
    });
  });
});
