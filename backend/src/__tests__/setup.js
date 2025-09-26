// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.STAGE = 'test';
process.env.PG_HOST = process.env.PG_HOST || 'localhost';
process.env.PG_PORT = process.env.PG_PORT || '5432';
process.env.PG_DATABASE = process.env.PG_DATABASE || 'u-control-test';
process.env.PG_USER = process.env.PG_USER || 'test_user';
process.env.PG_PASSWORD = process.env.PG_PASSWORD || 'test_password';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
