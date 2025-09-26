const config = require('../../config/env');

describe('Environment Configuration', () => {
  test('should load database configuration', () => {
    expect(config.database).toBeDefined();
    expect(config.database.host).toBeDefined();
    expect(config.database.port).toBeDefined();
    expect(config.database.database).toBeDefined();
    expect(config.database.user).toBeDefined();
    expect(config.database.password).toBeDefined();
  });

  test('should load JWT configuration', () => {
    expect(config.jwt).toBeDefined();
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.expiresIn).toBe('24h');
  });

  test('should load AWS configuration', () => {
    expect(config.aws).toBeDefined();
    expect(config.aws.accessKeyId).toBeDefined();
    expect(config.aws.secretAccessKey).toBeDefined();
    expect(config.aws.region).toBeDefined();
    expect(config.aws.deploymentBucket).toBeDefined();
  });

  test('should load serverless configuration', () => {
    expect(config.serverless).toBeDefined();
    expect(config.serverless.accessKey).toBeDefined();
  });

  test('should load application configuration', () => {
    expect(config.app).toBeDefined();
    expect(config.app.stage).toBeDefined();
    expect(config.app.port).toBeDefined();
  });

  test('should have valid database port', () => {
    expect(typeof config.database.port).toBe('number');
    expect(config.database.port).toBeGreaterThan(0);
    expect(config.database.port).toBeLessThan(65536);
  });
});
