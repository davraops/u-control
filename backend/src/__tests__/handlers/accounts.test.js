const accountsHandler = require('../../handlers/accounts');

// Mock the Account model
jest.mock('../../models/Account', () => {
  return jest.fn().mockImplementation((data) => ({
    id: data.id || 'test-id-123',
    name: data.name,
    type: data.type,
    bank: data.bank,
    accountNumber: data.accountNumber,
    balance: parseFloat(data.balance) || 0,
    currency: data.currency || 'COP',
    tags: data.tags || [],
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: data.createdAt || '2024-01-01T00:00:00Z',
    updatedAt: data.updatedAt || '2024-01-01T00:00:00Z',
    validate: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    toJSON: jest.fn().mockReturnValue({
      id: 'test-id-123',
      name: data.name,
      type: data.type,
      bank: data.bank,
      accountNumber: data.accountNumber,
      balance: parseFloat(data.balance) || 0,
      currency: data.currency || 'COP',
      tags: data.tags || [],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    })
  }));
});

// Mock the Account static methods
const Account = require('../../models/Account');
Account.getAvailableTags = jest.fn().mockReturnValue([
  { value: 'personal', label: 'Personal', color: 'primary', icon: '👤' },
  { value: 'empresa', label: 'Empresa', color: 'secondary', icon: '🏢' }
]);

describe('Accounts Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OPTIONS requests', () => {
    it('should handle OPTIONS request', async () => {
      const event = {
        httpMethod: 'OPTIONS'
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(result.body).toBe('');
    });
  });

  describe('GET requests', () => {
    it('should get all accounts', async () => {
      const event = {
        httpMethod: 'GET',
        pathParameters: null
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('accounts');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('totalBalance');
      expect(body).toHaveProperty('tagSummary');
      expect(body).toHaveProperty('availableTags');
    });

    it('should get specific account by ID', async () => {
      const event = {
        httpMethod: 'GET',
        pathParameters: { id: 'test-id-123' }
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('id', 'test-id-123');
    });

    it('should return 404 for non-existent account', async () => {
      const event = {
        httpMethod: 'GET',
        pathParameters: { id: 'non-existent-id' }
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(404);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Cuenta no encontrada');
    });
  });

  describe('POST requests', () => {
    it('should create new account with tags', async () => {
      const accountData = {
        name: 'Test Account',
        type: 'checking',
        bank: 'Test Bank',
        accountNumber: '1234',
        balance: 1000,
        currency: 'COP',
        tags: ['personal']
      };

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify(accountData)
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(201);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('id');
      expect(body.name).toBe('Test Account');
      expect(body.tags).toEqual(['personal']);
    });

    it('should return 400 for invalid account data', async () => {
      // Mock the Account constructor to return an invalid account
      const Account = require('../../models/Account');
      const originalConstructor = Account;
      
      Account.mockImplementation((data) => {
        const account = new originalConstructor(data);
        account.validate = jest.fn().mockReturnValue({
          isValid: false,
          errors: ['El nombre de la cuenta es requerido']
        });
        return account;
      });

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({})
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(400);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Datos de cuenta inválidos');
      expect(body.errors).toContain('El nombre de la cuenta es requerido');
    });
  });

  describe('PUT requests', () => {
    it('should update existing account', async () => {
      const updateData = {
        name: 'Updated Account',
        tags: ['empresa']
      };

      const event = {
        httpMethod: 'PUT',
        pathParameters: { id: 'test-id-123' },
        body: JSON.stringify(updateData)
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.name).toBe('Updated Account');
      expect(body.tags).toEqual(['empresa']);
    });

    it('should return 400 for missing account ID', async () => {
      const event = {
        httpMethod: 'PUT',
        pathParameters: null,
        body: JSON.stringify({ name: 'Test' })
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(400);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('ID de cuenta requerido');
    });

    it('should return 404 for non-existent account update', async () => {
      const event = {
        httpMethod: 'PUT',
        pathParameters: { id: 'non-existent-id' },
        body: JSON.stringify({ name: 'Test' })
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(404);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Cuenta no encontrada');
    });
  });

  describe('DELETE requests', () => {
    it('should soft delete account', async () => {
      const event = {
        httpMethod: 'DELETE',
        pathParameters: { id: 'test-id-123' }
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Cuenta eliminada exitosamente');
    });

    it('should return 400 for missing account ID', async () => {
      const event = {
        httpMethod: 'DELETE',
        pathParameters: null
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(400);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('ID de cuenta requerido');
    });

    it('should return 404 for non-existent account deletion', async () => {
      const event = {
        httpMethod: 'DELETE',
        pathParameters: { id: 'non-existent-id' }
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(404);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Cuenta no encontrada');
    });
  });

  describe('Unsupported methods', () => {
    it('should return 405 for unsupported method', async () => {
      const event = {
        httpMethod: 'PATCH'
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(405);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Método no permitido');
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parse errors', async () => {
      const event = {
        httpMethod: 'POST',
        body: 'invalid json'
      };

      const result = await accountsHandler.handler(event, {});

      expect(result.statusCode).toBe(500);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Error interno del servidor');
    });
  });
});
