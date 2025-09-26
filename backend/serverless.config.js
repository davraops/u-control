module.exports = {
  service: 'u-control-backend',
  frameworkVersion: '3',
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    stage: '${opt:stage, "dev"}',
    region: 'us-east-1',
    deploymentBucket: {
      name: 'u-control-906421059987',
      serverSideEncryption: 'AES256'
    },
    environment: {
      STAGE: '${self:provider.stage}'
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem'
        ],
        Resource: '*'
      }
    ]
  },
  functions: {
    hello: {
      handler: 'src/handlers/hello.handler',
      events: [
        {
          http: {
            path: 'hello',
            method: 'get',
            cors: true
          }
        }
      ]
    }
  },
  plugins: ['serverless-offline'],
  custom: {
    'serverless-offline': {
      httpPort: 3001,
      host: '0.0.0.0'
    }
  }
};
