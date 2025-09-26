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
AWS_ACCESS_KEY_ID=AKIA5GCXHYGJ537CAJE7
AWS_SECRET_ACCESS_KEY=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
AWS_DEFAULT_REGION=us-east-1
AWS_DEPLOYMENT_BUCKET=u-control-906421059987

# Serverless Configuration
SERVERLESS_ACCESS_KEY=AKOpvaNEvVaOmUieOwQWc9LRWMPcNHc6VlrG6zRqJJytH
```

## How it works

The application will automatically load these variables from:
1. `.env` file (if it exists)
2. System environment variables
3. Default values (as fallback)

## Security Note

Never commit the `.env` file to version control. It's already included in `.gitignore`.
