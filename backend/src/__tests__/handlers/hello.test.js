const handler = require('../../handlers/hello');

// Mock the database pool
jest.mock('../../config/database', () => ({
  connect: jest.fn(),
  end: jest.fn()
}));

// Mock JWT
jest.mock('../../config/jwt', () => ({
  generateToken: jest.fn(() => 'mock-jwt-token')
}));

const mockPool = require('../../config/database');

describe('Hello Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment
    process.env.STAGE = 'test';
  });

  test('should return success response with database connection', async () => {
    // Mock successful database connection
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [{ current_time: '2025-01-01T00:00:00.000Z' }]
      }),
      release: jest.fn()
    };
    mockPool.connect.mockResolvedValue(mockClient);

    const event = {};
    const context = {};

    const result = await handler.handler(event, context);

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');

    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello from u-control backend!');
    expect(body.stage).toBe('test');
    expect(body.database.connected).toBe(true);
    expect(body.database.currentTime).toBe('2025-01-01T00:00:00.000Z');
    expect(body.jwt.token).toBe('mock-jwt-token');
    expect(body.jwt.secret).toBe('configured');

    expect(mockClient.release).toHaveBeenCalled();
  });

  test('should return error response when database connection fails', async () => {
    // Mock database connection failure
    mockPool.connect.mockRejectedValue(new Error('Database connection failed'));

    const event = {};
    const context = {};

    const result = await handler.handler(event, context);

    expect(result.statusCode).toBe(500);
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');

    const body = JSON.parse(result.body);
    expect(body.message).toBe('Error connecting to database');
    expect(body.error).toBe('Database connection failed');
    expect(body.stage).toBe('test');
  });

  test('should handle different event types', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [{ current_time: '2025-01-01T00:00:00.000Z' }]
      }),
      release: jest.fn()
    };
    mockPool.connect.mockResolvedValue(mockClient);

    const event = { httpMethod: 'GET', path: '/hello' };
    const context = { requestId: 'test-request-id' };

    const result = await handler.handler(event, context);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello from u-control backend!');
  });

  test('should include timestamp in response', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [{ current_time: '2025-01-01T00:00:00.000Z' }]
      }),
      release: jest.fn()
    };
    mockPool.connect.mockResolvedValue(mockClient);

    const event = {};
    const context = {};

    const result = await handler.handler(event, context);
    const body = JSON.parse(result.body);

    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp)).toBeInstanceOf(Date);
  });
});
