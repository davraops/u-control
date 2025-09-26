require('dotenv').config();

const config = {
  // Database Configuration
  database: {
    host: process.env.PG_HOST || 'db-dev.tarotencalma.com',
    port: parseInt(process.env.PG_PORT) || 5432,
    database: process.env.PG_DATABASE || 'u-control',
    user: process.env.PG_USER || 'davra',
    password: process.env.PG_PASSWORD || '123qweZ!'
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || '123qweZ!',
    expiresIn: '24h'
  },
  
  // AWS Configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIA5GCXHYGJ537CAJE7',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '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',
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    deploymentBucket: process.env.AWS_DEPLOYMENT_BUCKET || 'u-control-906421059987'
  },
  
  // Serverless Configuration
  serverless: {
    accessKey: process.env.SERVERLESS_ACCESS_KEY || 'AKOpvaNEvVaOmUieOwQWc9LRWMPcNHc6VlrG6zRqJJytH'
  },
  
  // Application Configuration
  app: {
    stage: process.env.STAGE || 'dev',
    port: process.env.PORT || 3001
  }
};

module.exports = config;
