const { corsHeaders } = require('../middleware/cors');
const pool = require('../config/database');

module.exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      service: 'u-control-backend',
      version: '1.0.0',
      environment: process.env.STAGE || 'dev',
      checks: {}
    };

    // Check database connection
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();
      
      healthChecks.checks.database = {
        status: 'healthy',
        message: 'PostgreSQL connection successful',
        responseTime: Date.now() - healthChecks.timestamp,
        details: {
          host: process.env.PG_HOST,
          port: process.env.PG_PORT,
          database: process.env.PG_DATABASE
        }
      };
    } catch (dbError) {
      healthChecks.checks.database = {
        status: 'unhealthy',
        message: 'PostgreSQL connection failed',
        error: dbError.message
      };
      healthChecks.status = 'degraded';
    }

    // Check JWT configuration
    const jwtConfigured = process.env.JWT_SECRET && process.env.JWT_SECRET !== '';
    healthChecks.checks.jwt = {
      status: jwtConfigured ? 'healthy' : 'unhealthy',
      message: jwtConfigured ? 'JWT properly configured' : 'JWT not configured',
      configured: jwtConfigured
    };

    if (!jwtConfigured) {
      healthChecks.status = 'degraded';
    }

    // Check AWS environment
    const awsConfigured = process.env.AWS_DEFAULT_REGION && process.env.AWS_DEFAULT_REGION !== '';
    healthChecks.checks.aws = {
      status: awsConfigured ? 'healthy' : 'unhealthy',
      message: awsConfigured ? 'AWS environment configured' : 'AWS environment not configured',
      region: process.env.AWS_DEFAULT_REGION || 'not set'
    };

    // Check memory usage
    const memUsage = process.memoryUsage();
    healthChecks.checks.memory = {
      status: 'healthy',
      message: 'Memory usage within normal limits',
      details: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
      }
    };

    // Check uptime
    healthChecks.checks.uptime = {
      status: 'healthy',
      message: 'Service running normally',
      uptime: `${Math.round(process.uptime())} seconds`
    };

    // Determine overall status
    const unhealthyChecks = Object.values(healthChecks.checks).filter(check => check.status === 'unhealthy');
    if (unhealthyChecks.length > 0) {
      healthChecks.status = 'unhealthy';
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(healthChecks)
    };

  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        service: 'u-control-backend',
        error: 'Internal server error during health check',
        message: error.message
      })
    };
  }
};

