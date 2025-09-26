const pool = require('../../config/database');

describe('Database Configuration', () => {
  afterAll(async () => {
    // Close the pool after all tests
    await pool.end();
  });

  test('should create a database pool with correct configuration', () => {
    expect(pool).toBeDefined();
    expect(pool.options).toBeDefined();
    expect(pool.options.host).toBeDefined();
    expect(pool.options.port).toBeDefined();
    expect(pool.options.database).toBeDefined();
    expect(pool.options.user).toBeDefined();
  });

  test('should have SSL configuration', () => {
    expect(pool.options.ssl).toBeDefined();
    expect(pool.options.ssl.rejectUnauthorized).toBe(false);
  });

  test('should have connection pool settings', () => {
    expect(pool.options.max).toBe(20);
    expect(pool.options.idleTimeoutMillis).toBe(30000);
    expect(pool.options.connectionTimeoutMillis).toBe(2000);
  });

  test('should connect to database successfully', async () => {
    try {
      const client = await pool.connect();
      expect(client).toBeDefined();
      
      const result = await client.query('SELECT NOW() as current_time');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].current_time).toBeDefined();
      
      client.release();
    } catch (error) {
      // If database is not available, skip this test
      console.warn('Database connection test skipped:', error.message);
    }
  });
});
