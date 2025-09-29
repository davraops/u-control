const { corsHeaders } = require('../middleware/cors');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// Helper function to convert database row to API format
function formatIncome(row) {
  return {
    id: row.id,
    amount: parseFloat(row.amount),
    currency: row.currency,
    description: row.description,
    category: row.category,
    accountId: row.account_id,
    date: row.date,
    tags: row.tags || [],
    isRecurring: row.is_recurring,
    recurringPattern: row.recurring_pattern,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports.handler = async (event) => {
  console.log('Incomes handler called with method:', event.httpMethod);
  
  try {
    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(event);
      case 'POST':
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
    console.error('Error in incomes handler:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
};

async function handleGet(event) {
  const { pathParameters } = event;
  
  if (pathParameters && pathParameters.id) {
    // Get single income
    const result = await pool.query(
      'SELECT * FROM incomes WHERE id = $1 AND is_active = true',
      [pathParameters.id]
    );
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Income not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ income: formatIncome(result.rows[0]) })
    };
  } else {
    // Get all incomes
    const result = await pool.query(
      'SELECT * FROM incomes WHERE is_active = true ORDER BY date DESC'
    );
    
    const incomes = result.rows.map(formatIncome);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ incomes })
    };
  }
}

async function handlePost(event) {
  const body = JSON.parse(event.body || '{}');
  
  // Validate required fields
  if (!body.amount || !body.description || !body.category || !body.accountId || !body.date) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Missing required fields: amount, description, category, accountId, date' 
      })
    };
  }
  
  const incomeId = uuidv4();
  
  const result = await pool.query(
    `INSERT INTO incomes (id, amount, currency, description, category, account_id, date, tags, is_recurring, recurring_pattern, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      incomeId,
      body.amount,
      body.currency || 'COP',
      body.description,
      body.category,
      body.accountId,
      body.date,
      body.tags || [],
      body.isRecurring || false,
      body.recurringPattern || null,
      body.isActive !== false
    ]
  );
  
  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({ income: formatIncome(result.rows[0]) })
  };
}

async function handlePut(event) {
  const { pathParameters } = event;
  const body = JSON.parse(event.body || '{}');
  
  if (!pathParameters || !pathParameters.id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Income ID is required' })
    };
  }
  
  // Build dynamic update query
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  if (body.amount !== undefined) {
    updateFields.push(`amount = $${paramCount++}`);
    values.push(body.amount);
  }
  if (body.currency !== undefined) {
    updateFields.push(`currency = $${paramCount++}`);
    values.push(body.currency);
  }
  if (body.description !== undefined) {
    updateFields.push(`description = $${paramCount++}`);
    values.push(body.description);
  }
  if (body.category !== undefined) {
    updateFields.push(`category = $${paramCount++}`);
    values.push(body.category);
  }
  if (body.accountId !== undefined) {
    updateFields.push(`account_id = $${paramCount++}`);
    values.push(body.accountId);
  }
  if (body.date !== undefined) {
    updateFields.push(`date = $${paramCount++}`);
    values.push(body.date);
  }
  if (body.tags !== undefined) {
    updateFields.push(`tags = $${paramCount++}`);
    values.push(body.tags);
  }
  if (body.isRecurring !== undefined) {
    updateFields.push(`is_recurring = $${paramCount++}`);
    values.push(body.isRecurring);
  }
  if (body.recurringPattern !== undefined) {
    updateFields.push(`recurring_pattern = $${paramCount++}`);
    values.push(body.recurringPattern);
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
  
  const result = await pool.query(
    `UPDATE incomes SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND is_active = true RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Income not found' })
    };
  }
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ income: formatIncome(result.rows[0]) })
  };
}

async function handleDelete(event) {
  const { pathParameters } = event;
  
  if (!pathParameters || !pathParameters.id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Income ID is required' })
    };
  }
  
  // Soft delete by setting is_active to false
  const result = await pool.query(
    'UPDATE incomes SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [pathParameters.id]
  );
  
  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Income not found' })
    };
  }
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Income deleted successfully' })
  };
}
