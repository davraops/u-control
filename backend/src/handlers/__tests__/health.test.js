const { handler } = require('../health');

describe('Health Handler', () => {
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

  describe('GET /health', () => {
    it('should return health status', async () => {
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(200);
      expect(result.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(result.body);
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('service');
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('environment');
      expect(body).toHaveProperty('checks');
      
      expect(body.status).toBe('healthy');
      expect(body.service).toBe('u-control-backend');
      expect(body.environment).toBe('dev');
    });

    it('should include database check', async () => {
      const result = await handler(mockEvent);
      
      const body = JSON.parse(result.body);
      expect(body.checks).toHaveProperty('database');
      expect(body.checks.database).toHaveProperty('status');
      expect(body.checks.database).toHaveProperty('message');
    });

    it('should include JWT check', async () => {
      const result = await handler(mockEvent);
      
      const body = JSON.parse(result.body);
      expect(body.checks).toHaveProperty('jwt');
      expect(body.checks.jwt).toHaveProperty('status');
      expect(body.checks.jwt).toHaveProperty('message');
      expect(body.checks.jwt).toHaveProperty('configured');
    });

    it('should include AWS check', async () => {
      const result = await handler(mockEvent);
      
      const body = JSON.parse(result.body);
      expect(body.checks).toHaveProperty('aws');
      expect(body.checks.aws).toHaveProperty('status');
      expect(body.checks.aws).toHaveProperty('message');
    });

    it('should include memory check', async () => {
      const result = await handler(mockEvent);
      
      const body = JSON.parse(result.body);
      expect(body.checks).toHaveProperty('memory');
      expect(body.checks.memory).toHaveProperty('status');
      expect(body.checks.memory).toHaveProperty('message');
      expect(body.checks.memory).toHaveProperty('details');
    });

    it('should include uptime check', async () => {
      const result = await handler(mockEvent);
      
      const body = JSON.parse(result.body);
      expect(body.checks).toHaveProperty('uptime');
      expect(body.checks.uptime).toHaveProperty('status');
      expect(body.checks.uptime).toHaveProperty('message');
    });

    it('should have all checks as healthy', async () => {
      const result = await handler(mockEvent);
      
      const body = JSON.parse(result.body);
      Object.values(body.checks).forEach(check => {
        expect(check.status).toBe('healthy');
      });
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const result = await handler(mockEvent);
      
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Headers');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
    });
  });
});
