const packageJson = require('../../package.json');
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
    const version = {
      service: 'u-control-backend',
      version: packageJson.version,
      description: packageJson.description,
      timestamp: new Date().toISOString(),
      stage: process.env.STAGE || 'dev',
      environment: {
        node: process.version,
        region: process.env.AWS_REGION || 'us-east-1',
        stage: process.env.STAGE || 'dev'
      },
      build: {
        timestamp: new Date().toISOString(),
        git: {
          // These would be populated by CI/CD in production
          commit: process.env.GIT_COMMIT || 'local',
          branch: process.env.GIT_BRANCH || 'main'
        }
      }
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(version)
    };
  } catch (error) {
    console.error('Error getting version:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to get version information',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
