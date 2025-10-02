const { corsHeaders } = require('../middleware/cors');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken, verifyToken, JWT_SECRET } = require('../config/jwt');

// Helper function to get user ID from JWT token
function getUserIdFromToken(event) {
  const token = event.headers.Authorization || event.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const actualToken = token.replace('Bearer ', '');
    const decoded = verifyToken(actualToken);
    return decoded.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Helper function to convert database row to API format
function formatAccount(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    bank: row.bank,
    accountNumber: row.account_number,
    balance: parseFloat(row.balance),
    currency: row.currency,
    tags: row.tags || [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports.handler = async (event) => {
  console.log('Accounts handler called with method:', event.httpMethod);
  
  try {
    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(event);
      case 'POST':
        console.log('POST request received, body:', event.body);
        // Check if this is a login request
        if (event.body) {
          try {
            const body = JSON.parse(event.body);
            console.log('Parsed body:', body);
            if ((body.username && body.password) || (body.email && body.password)) {
              console.log('Login request detected, calling handleLogin');
              return await handleLogin(body);
            }
          } catch (error) {
            console.error('Error parsing login request:', error);
          }
        }
        console.log('Not a login request, calling handlePost');
        return await handlePost(event);
      case 'PUT':
        return await handlePut(event);
      case 'DELETE':
        return await handleDelete(event);
      case 'OPTIONS':
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: ''
        };
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error in accounts handler:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
};

async function handleGet(event) {
  const { pathParameters, queryStringParameters } = event;
  const userId = getUserIdFromToken(event);
  
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Token de autorización requerido' })
    };
  }
  
  if (pathParameters && pathParameters.id) {
    // Get single account
    const result = await pool.query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2 AND is_active = true',
      [pathParameters.id, userId]
    );
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Account not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ account: formatAccount(result.rows[0]) })
    };
  } else if (queryStringParameters && queryStringParameters.tags) {
    // Get accounts by tags
    const tags = queryStringParameters.tags.split(',');
    const result = await pool.query(
      'SELECT * FROM accounts WHERE is_active = true AND tags && $1 ORDER BY name',
      [tags]
    );
    
    const accounts = result.rows.map(formatAccount);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ accounts })
    };
  } else {
    // Get all accounts for the user
    const result = await pool.query(
      'SELECT * FROM accounts WHERE user_id = $1 AND is_active = true ORDER BY name',
      [userId]
    );
    
    const accounts = result.rows.map(formatAccount);
    
    // Calculate tag summary
    const tagSummary = {};
    accounts.forEach(account => {
      account.tags.forEach(tag => {
        tagSummary[tag] = (tagSummary[tag] || 0) + 1;
      });
    });
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        accounts,
        tagSummary 
      })
    };
  }
}

async function handlePost(event) {
  const body = JSON.parse(event.body || '{}');
  
  // Get user ID from token
  const userId = getUserIdFromToken(event);
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Unauthorized' })
    };
  }
  
  // Validate required fields
  if (!body.name || !body.type) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Missing required fields: name, type' 
      })
    };
  }
  
  // Validate account type
  const validTypes = ['checking', 'savings', 'credit', 'cash', 'investment'];
  if (!validTypes.includes(body.type)) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: `Invalid account type. Must be one of: ${validTypes.join(', ')}` 
      })
    };
  }
  
  const accountId = uuidv4();
  
  const result = await pool.query(
    `INSERT INTO accounts (id, name, type, bank, account_number, balance, currency, tags, is_active, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      accountId,
      body.name,
      body.type,
      body.bank || null,
      body.accountNumber || null,
      body.balance || 0,
      body.currency || 'COP',
      body.tags || [],
      body.isActive !== false,
      userId
    ]
  );
  
  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({ account: formatAccount(result.rows[0]) })
  };
}

async function handlePut(event) {
  const { pathParameters } = event;
  const body = JSON.parse(event.body || '{}');
  
  // Get user ID from token
  const userId = getUserIdFromToken(event);
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Unauthorized' })
    };
  }
  
  if (!pathParameters || !pathParameters.id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Account ID is required' })
    };
  }
  
  // Build dynamic update query
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (body.name !== undefined) {
    updateFields.push(`name = $${paramCount++}`);
    values.push(body.name);
  }
  if (body.type !== undefined) {
    // Validate account type
    const validTypes = ['checking', 'savings', 'credit', 'cash', 'investment'];
    if (!validTypes.includes(body.type)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          message: `Invalid account type. Must be one of: ${validTypes.join(', ')}` 
        })
      };
    }
    updateFields.push(`type = $${paramCount++}`);
    values.push(body.type);
  }
  if (body.bank !== undefined) {
    updateFields.push(`bank = $${paramCount++}`);
    values.push(body.bank);
  }
  if (body.accountNumber !== undefined) {
    updateFields.push(`account_number = $${paramCount++}`);
    values.push(body.accountNumber);
  }
  if (body.balance !== undefined) {
    updateFields.push(`balance = $${paramCount++}`);
    values.push(body.balance);
  }
  if (body.currency !== undefined) {
    updateFields.push(`currency = $${paramCount++}`);
    values.push(body.currency);
  }
  if (body.tags !== undefined) {
    updateFields.push(`tags = $${paramCount++}`);
    values.push(body.tags);
  }
  if (body.isActive !== undefined) {
    updateFields.push(`is_active = $${paramCount++}`);
    values.push(body.isActive);
  }
  
  if (updateFields.length === 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'No fields to update' })
    };
  }
  
  updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(pathParameters.id);
  values.push(userId);
  
  const result = await pool.query(
    `UPDATE accounts SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND user_id = $${paramCount + 1} AND is_active = true RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Account not found' })
    };
  }
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ account: formatAccount(result.rows[0]) })
  };
}

async function handleDelete(event) {
  const { pathParameters } = event;
  
  // Get user ID from token
  const userId = getUserIdFromToken(event);
  if (!userId) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Unauthorized' })
    };
  }
  
  if (!pathParameters || !pathParameters.id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Account ID is required' })
    };
  }
  
  // Soft delete by setting is_active to false
  const result = await pool.query(
    'UPDATE accounts SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
    [pathParameters.id, userId]
  );
  
  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Account not found' })
    };
  }
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Account deleted successfully' })
  };
}

// Login handler function
async function handleLogin({ username, password, email }) {
  const loginField = username || email;
  console.log('Login attempt for username/email:', loginField);
  try {
    
    // Find user by username
    const userResult = await pool.query(
      'SELECT id, username, password, name FROM users WHERE username = $1',
      [loginField]
    );
    
    console.log('User query result:', userResult.rows.length, 'rows found');
    
    if (userResult.rows.length === 0) {
      return {
        statusCode: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Credenciales inválidas'
        })
      };
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Credenciales inválidas'
        })
      };
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id, 
      username: user.username 
    });
    
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name
        }
      })
    };
    
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Error interno del servidor'
      })
    };
  }
}
