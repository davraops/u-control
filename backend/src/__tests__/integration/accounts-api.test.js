const request = require('supertest');

// Mock the serverless-offline for testing
const createMockEvent = (method, path, body = null, pathParameters = null) => ({
  httpMethod: method,
  path: path,
  body: body,
  pathParameters: pathParameters,
  headers: {
    'Content-Type': 'application/json'
  }
});

const createMockContext = () => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'accounts',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:accounts',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/accounts',
  logStreamName: '2024/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000
});

describe('Accounts API Integration Tests', () => {
  let accountsHandler;

  beforeAll(async () => {
    accountsHandler = require('../../handlers/accounts');
  });

  describe('GET /accounts', () => {
    it('should return all accounts with tag summary', async () => {
      const event = createMockEvent('GET', '/accounts');
      const context = createMockContext();

      const result = await accountsHandler.handler(event, context);

      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('accounts');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('totalBalance');
      expect(body).toHaveProperty('tagSummary');
      expect(body).toHaveProperty('availableTags');
      
      // Check that accounts have tags
      expect(Array.isArray(body.accounts)).toBe(true);
      body.accounts.forEach(account => {
        expect(account).toHaveProperty('tags');
        expect(Array.isArray(account.tags)).toBe(true);
      });
    });

    it('should handle CORS preflight request', async () => {
      const event = createMockEvent('OPTIONS', '/accounts');
      const context = createMockContext();

      const result = await accountsHandler.handler(event, context);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Headers');
    });
  });

  describe('POST /accounts', () => {
    it('should create account with personal tag', async () => {
      const accountData = {
        name: 'Test Personal Account',
        type: 'checking',
        bank: 'Test Bank',
        accountNumber: '1234',
        balance: 1000,
        currency: 'COP',
        tags: ['personal']
      };

      const event = createMockEvent('POST', '/accounts', JSON.stringify(accountData));
      const context = createMockContext();

      const result = await accountsHandler.handler(event, context);

      expect(result.statusCode).toBe(201);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.name).toBe('Test Personal Account');
      expect(body.tags).toEqual(['personal']);
      expect(body.type).toBe('checking');
    });

    it('should create account with multiple tags', async () => {
      const accountData = {
        name: 'Test Business Account',
        type: 'checking',
        bank: 'Business Bank',
        accountNumber: '5678',
        balance: 5000,
        currency: 'USD',
        tags: ['empresa', 'gastos']
      };

      const event = createMockEvent('POST', '/accounts', JSON.stringify(accountData));
      const context = createMockContext();

      const result = await accountsHandler.handler(event, context);

      expect(result.statusCode).toBe(201);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.name).toBe('Test Business Account');
      expect(body.tags).toEqual(['empresa', 'gastos']);
      expect(body.currency).toBe('USD');
    });

    it('should create cash account without bank', async () => {
      const accountData = {
        name: 'Cash Wallet',
        type: 'cash',
        balance: 500,
        currency: 'COP',
        tags: ['personal']
      };

      const event = createMockEvent('POST', '/accounts', JSON.stringify(accountData));
      const context = createMockContext();

      const result = await accountsHandler.handler(event, context);

      expect(result.statusCode).toBe(201);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.name).toBe('Cash Wallet');
      expect(body.type).toBe('cash');
      expect(body.tags).toEqual(['personal']);
    });

    it('should return 400 for invalid account data', async () => {
      const invalidData = {
        name: '', // Empty name
        type: 'invalid_type',
        balance: -100 // Negative balance
      };

      const event = createMockEvent('POST', '/accounts', JSON.stringify(invalidData));
      const context = createMockContext();

      const result = await accountsHandler.handler(event, context);

      expect(result.statusCode).toBe(400);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Datos de cuenta inválidos');
      expect(body.errors).toBeDefined();
    });
  });

  describe('GET /accounts/{id}', () => {
    it('should return specific account', async () => {
      // First create an account to get its ID
      const accountData = {
        name: 'Test Account for GET',
        type: 'savings',
        bank: 'Test Bank',
        balance: 2000,
        currency: 'COP',
        tags: ['ahorro']
      };

      const createEvent = createMockEvent('POST', '/accounts', JSON.stringify(accountData));
      const createResult = await accountsHandler.handler(createEvent, createMockContext());
      const createdAccount = JSON.parse(createResult.body);

      // Now get the account by ID
      const getEvent = createMockEvent('GET', `/accounts/${createdAccount.id}`, null, { id: createdAccount.id });
      const getResult = await accountsHandler.handler(getEvent, createMockContext());

      expect(getResult.statusCode).toBe(200);
      expect(getResult.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(getResult.body);
      expect(body.id).toBe(createdAccount.id);
      expect(body.name).toBe('Test Account for GET');
      expect(body.tags).toEqual(['ahorro']);
    });

    it('should return 404 for non-existent account', async () => {
      const event = createMockEvent('GET', '/accounts/non-existent-id', null, { id: 'non-existent-id' });
      const context = createMockContext();

      const result = await accountsHandler.handler(event, context);

      expect(result.statusCode).toBe(404);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Cuenta no encontrada');
    });
  });

  describe('PUT /accounts/{id}', () => {
    it('should update account tags', async () => {
      // First create an account
      const accountData = {
        name: 'Test Account for Update',
        type: 'checking',
        bank: 'Test Bank',
        balance: 1000,
        currency: 'COP',
        tags: ['personal']
      };

      const createEvent = createMockEvent('POST', '/accounts', JSON.stringify(accountData));
      const createResult = await accountsHandler.handler(createEvent, createMockContext());
      const createdAccount = JSON.parse(createResult.body);

      // Update the account
      const updateData = {
        name: 'Updated Account',
        tags: ['empresa', 'inversion']
      };

      const updateEvent = createMockEvent('PUT', `/accounts/${createdAccount.id}`, JSON.stringify(updateData), { id: createdAccount.id });
      const updateResult = await accountsHandler.handler(updateEvent, createMockContext());

      expect(updateResult.statusCode).toBe(200);
      expect(updateResult.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(updateResult.body);
      expect(body.id).toBe(createdAccount.id);
      expect(body.name).toBe('Updated Account');
      expect(body.tags).toEqual(['empresa', 'inversion']);
    });
  });

  describe('DELETE /accounts/{id}', () => {
    it('should soft delete account', async () => {
      // First create an account
      const accountData = {
        name: 'Test Account for Delete',
        type: 'checking',
        bank: 'Test Bank',
        balance: 1000,
        currency: 'COP',
        tags: ['personal']
      };

      const createEvent = createMockEvent('POST', '/accounts', JSON.stringify(accountData));
      const createResult = await accountsHandler.handler(createEvent, createMockContext());
      const createdAccount = JSON.parse(createResult.body);

      // Delete the account
      const deleteEvent = createMockEvent('DELETE', `/accounts/${createdAccount.id}`, null, { id: createdAccount.id });
      const deleteResult = await accountsHandler.handler(deleteEvent, createMockContext());

      expect(deleteResult.statusCode).toBe(200);
      expect(deleteResult.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(deleteResult.body);
      expect(body.message).toBe('Cuenta eliminada exitosamente');
    });
  });

  describe('Tag Summary Functionality', () => {
    it('should calculate tag summary correctly', async () => {
      const event = createMockEvent('GET', '/accounts');
      const context = createMockContext();

      const result = await accountsHandler.handler(event, context);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.tagSummary).toBeDefined();
      expect(typeof body.tagSummary).toBe('object');
      
      // Check that tag summary has the expected structure
      Object.entries(body.tagSummary).forEach(([tag, data]) => {
        expect(data).toHaveProperty('count');
        expect(data).toHaveProperty('balance');
        expect(typeof data.count).toBe('number');
        expect(typeof data.balance).toBe('number');
      });
    });
  });
});

