const pool = require('../config/database');
const { generateToken } = require('../config/jwt');
const config = require('../config/env');
const { corsHeaders } = require('../middleware/cors');

module.exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Debug configuration
    console.log('Configuration loaded:', {
      database: {
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        user: config.database.user
      },
      jwt: {
        secret: config.jwt.secret ? 'configured' : 'not configured'
      }
    });

    // Test database connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();

    // Generate a test JWT token
    const testToken = generateToken({ 
      userId: 'test-user', 
      email: 'test@example.com' 
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hello from u-control backend!',
        timestamp: new Date().toISOString(),
        stage: process.env.STAGE,
        database: {
          connected: true,
          currentTime: result.rows[0].current_time
        },
        jwt: {
          token: testToken,
          secret: process.env.JWT_SECRET ? 'configured' : 'not configured'
        }
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Error connecting to database',
        error: error.message,
        timestamp: new Date().toISOString(),
        stage: process.env.STAGE
      })
    };
  }
};
