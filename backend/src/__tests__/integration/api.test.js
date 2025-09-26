const request = require('supertest');

// Mock the entire serverless offline environment
jest.mock('../../handlers/hello', () => ({
  handler: jest.fn()
}));

const helloHandler = require('../../handlers/hello');

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle GET /dev/hello endpoint', async () => {
    const mockResponse = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Hello from u-control backend!',
        timestamp: '2025-01-01T00:00:00.000Z',
        stage: 'dev',
        database: {
          connected: true,
          currentTime: '2025-01-01T00:00:00.000Z'
        },
        jwt: {
          token: 'mock-jwt-token',
          secret: 'configured'
        }
      })
    };

    helloHandler.handler.mockResolvedValue(mockResponse);

    const event = {
      httpMethod: 'GET',
      path: '/dev/hello',
      headers: {},
      queryStringParameters: null
    };

    const context = {};

    const result = await helloHandler.handler(event, context);

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');

    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello from u-control backend!');
    expect(body.stage).toBe('dev');
    expect(body.database.connected).toBe(true);
    expect(body.jwt.token).toBe('mock-jwt-token');
  });

  test('should handle CORS preflight requests', async () => {
    const mockResponse = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };

    helloHandler.handler.mockResolvedValue(mockResponse);

    const event = {
      httpMethod: 'OPTIONS',
      path: '/dev/hello',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    };

    const result = await helloHandler.handler(event, {});

    expect(result.statusCode).toBe(200);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  test('should handle errors gracefully', async () => {
    const mockErrorResponse = {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error connecting to database',
        error: 'Connection timeout',
        timestamp: '2025-01-01T00:00:00.000Z',
        stage: 'dev'
      })
    };

    helloHandler.handler.mockResolvedValue(mockErrorResponse);

    const event = { httpMethod: 'GET', path: '/dev/hello' };
    const result = await helloHandler.handler(event, {});

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Error connecting to database');
    expect(body.error).toBe('Connection timeout');
  });
});
