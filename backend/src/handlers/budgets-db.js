const { corsHeaders } = require('../middleware/cors');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// Helper function to convert database row to API format
function formatBudget(row) {
  return {
    id: row.id,
    name: row.name,
    month: row.month,
    year: row.year,
    period: row.period,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    budgetType: row.budget_type,
    percentage: row.percentage ? parseFloat(row.percentage) : null,
    categories: row.categories || [],
    totalBudgeted: parseFloat(row.total_budgeted),
    totalSpent: parseFloat(row.total_spent),
    totalRemaining: parseFloat(row.total_remaining),
    status: row.status,
    isDefault: row.is_default,
    isActive: row.is_active,
    totalIncome: row.total_income ? parseFloat(row.total_income) : null,
    budgetPercentageOfIncome: row.budget_percentage_of_income ? parseFloat(row.budget_percentage_of_income) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports.handler = async (event) => {
  console.log('Budgets handler called with method:', event.httpMethod);
  
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
    console.error('Error in budgets handler:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
};

async function handleGet(event) {
  const { pathParameters, queryStringParameters } = event;
  
  if (pathParameters && pathParameters.id) {
    // Get single budget
    const result = await pool.query(
      'SELECT * FROM budgets WHERE id = $1 AND is_active = true',
      [pathParameters.id]
    );
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Budget not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ budget: formatBudget(result.rows[0]) })
    };
  } else if (queryStringParameters && queryStringParameters.default === 'true') {
    // Get default budget
    const result = await pool.query(
      'SELECT * FROM budgets WHERE is_default = true AND is_active = true ORDER BY created_at DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'No default budget found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ budget: formatBudget(result.rows[0]) })
    };
  } else {
    // Get all budgets
    const result = await pool.query(
      'SELECT * FROM budgets WHERE is_active = true ORDER BY year DESC, month DESC'
    );
    
    const budgets = result.rows.map(formatBudget);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ budgets })
    };
  }
}

async function handlePost(event) {
  const body = JSON.parse(event.body || '{}');
  
  // Validate required fields
  if (!body.name || !body.month || !body.year || !body.categories) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Missing required fields: name, month, year, categories' 
      })
    };
  }
  
  // Check for conflicts (same month, year, and name)
  const conflictCheck = await pool.query(
    'SELECT id FROM budgets WHERE month = $1 AND year = $2 AND name = $3 AND is_active = true',
    [body.month, body.year, body.name]
  );
  
  if (conflictCheck.rows.length > 0) {
    return {
      statusCode: 409,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Budget conflict: A budget with the same name already exists for this period',
        existingBudget: formatBudget(conflictCheck.rows[0])
      })
    };
  }
  
  const budgetId = uuidv4();
  
  // Calculate totals
  const totalBudgeted = body.categories.reduce((sum, cat) => sum + (cat.budgeted || 0), 0);
  const totalSpent = body.categories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
  const totalRemaining = totalBudgeted - totalSpent;
  
  const result = await pool.query(
    `INSERT INTO budgets (id, name, month, year, period, period_start, period_end, budget_type, percentage, categories, total_budgeted, total_spent, total_remaining, status, is_default, is_active, total_income, budget_percentage_of_income)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING *`,
    [
      budgetId,
      body.name,
      body.month,
      body.year,
      body.period || 'monthly',
      body.periodStart || null,
      body.periodEnd || null,
      body.budgetType || 'fixed',
      body.percentage || null,
      JSON.stringify(body.categories),
      totalBudgeted,
      totalSpent,
      totalRemaining,
      body.status || 'draft',
      body.isDefault || false,
      body.isActive !== false,
      body.totalIncome || null,
      body.budgetPercentageOfIncome || null
    ]
  );
  
  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({ budget: formatBudget(result.rows[0]) })
  };
}

async function handlePut(event) {
  const { pathParameters } = event;
  const body = JSON.parse(event.body || '{}');
  
  if (!pathParameters || !pathParameters.id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Budget ID is required' })
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
  if (body.month !== undefined) {
    updateFields.push(`month = $${paramCount++}`);
    values.push(body.month);
  }
  if (body.year !== undefined) {
    updateFields.push(`year = $${paramCount++}`);
    values.push(body.year);
  }
  if (body.period !== undefined) {
    updateFields.push(`period = $${paramCount++}`);
    values.push(body.period);
  }
  if (body.periodStart !== undefined) {
    updateFields.push(`period_start = $${paramCount++}`);
    values.push(body.periodStart);
  }
  if (body.periodEnd !== undefined) {
    updateFields.push(`period_end = $${paramCount++}`);
    values.push(body.periodEnd);
  }
  if (body.budgetType !== undefined) {
    updateFields.push(`budget_type = $${paramCount++}`);
    values.push(body.budgetType);
  }
  if (body.percentage !== undefined) {
    updateFields.push(`percentage = $${paramCount++}`);
    values.push(body.percentage);
  }
  if (body.categories !== undefined) {
    updateFields.push(`categories = $${paramCount++}`);
    values.push(JSON.stringify(body.categories));
    
    // Recalculate totals
    const totalBudgeted = body.categories.reduce((sum, cat) => sum + (cat.budgeted || 0), 0);
    const totalSpent = body.categories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
    const totalRemaining = totalBudgeted - totalSpent;
    
    updateFields.push(`total_budgeted = $${paramCount++}`);
    values.push(totalBudgeted);
    updateFields.push(`total_spent = $${paramCount++}`);
    values.push(totalSpent);
    updateFields.push(`total_remaining = $${paramCount++}`);
    values.push(totalRemaining);
  }
  if (body.status !== undefined) {
    updateFields.push(`status = $${paramCount++}`);
    values.push(body.status);
  }
  if (body.isDefault !== undefined) {
    updateFields.push(`is_default = $${paramCount++}`);
    values.push(body.isDefault);
  }
  if (body.isActive !== undefined) {
    updateFields.push(`is_active = $${paramCount++}`);
    values.push(body.isActive);
  }
  if (body.totalIncome !== undefined) {
    updateFields.push(`total_income = $${paramCount++}`);
    values.push(body.totalIncome);
  }
  if (body.budgetPercentageOfIncome !== undefined) {
    updateFields.push(`budget_percentage_of_income = $${paramCount++}`);
    values.push(body.budgetPercentageOfIncome);
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
    `UPDATE budgets SET ${updateFields.join(', ')} WHERE id = $${paramCount} AND is_active = true RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Budget not found' })
    };
  }
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ budget: formatBudget(result.rows[0]) })
  };
}

async function handleDelete(event) {
  const { pathParameters } = event;
  
  if (!pathParameters || !pathParameters.id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Budget ID is required' })
    };
  }
  
  // Soft delete by setting is_active to false
  const result = await pool.query(
    'UPDATE budgets SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [pathParameters.id]
  );
  
  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Budget not found' })
    };
  }
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Budget deleted successfully' })
  };
}
