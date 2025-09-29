# Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Database Configuration
PG_HOST=db-dev.tarotencalma.com
PG_PORT=5432
PG_DATABASE=u-control
PG_USER=davra
PG_PASSWORD=123qweZ!

# JWT Configuration
JWT_SECRET=123qweZ!

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_DEFAULT_REGION=us-east-1
AWS_DEPLOYMENT_BUCKET=your_deployment_bucket_name

# Serverless Configuration
SERVERLESS_ACCESS_KEY=your_serverless_access_key_here
```

## How it works

The application will automatically load these variables from:
1. `.env` file (if it exists)
2. System environment variables
3. Default values (as fallback)

## Security Note

Never commit the `.env` file to version control. It's already included in `.gitignore`.
