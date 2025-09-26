const { generateToken, verifyToken, JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/jwt');

describe('JWT Configuration', () => {
  test('should have JWT secret configured', () => {
    expect(JWT_SECRET).toBeDefined();
    expect(JWT_SECRET).not.toBe('');
  });

  test('should have JWT expiration time configured', () => {
    expect(JWT_EXPIRES_IN).toBeDefined();
    expect(JWT_EXPIRES_IN).toBe('24h');
  });

  test('should generate a valid JWT token', () => {
    const payload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      role: 'user'
    };

    const token = generateToken(payload);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  test('should verify a valid JWT token', () => {
    const payload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      role: 'user'
    };

    const token = generateToken(payload);
    const decoded = verifyToken(token);
    
    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.iat).toBeDefined();
    expect(decoded.exp).toBeDefined();
  });

  test('should throw error for invalid token', () => {
    const invalidToken = 'invalid.token.here';
    
    expect(() => {
      verifyToken(invalidToken);
    }).toThrow('Invalid token');
  });

  test('should throw error for expired token', () => {
    // Create a token with very short expiration (1ms)
    const payload = { userId: 'test-user' };
    const token = require('jsonwebtoken').sign(payload, JWT_SECRET, { expiresIn: '1ms' });
    
    // Wait for token to expire
    setTimeout(() => {
      expect(() => {
        verifyToken(token);
      }).toThrow();
    }, 10);
  });

  test('should generate different tokens for different payloads', () => {
    const payload1 = { userId: 'user1' };
    const payload2 = { userId: 'user2' };
    
    const token1 = generateToken(payload1);
    const token2 = generateToken(payload2);
    
    expect(token1).not.toBe(token2);
  });
});
