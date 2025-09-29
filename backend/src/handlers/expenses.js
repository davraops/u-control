const { corsHeaders } = require('../middleware/cors');
const Expense = require('../models/Expense');

// Simulamos una base de datos en memoria (en producción sería PostgreSQL)
let expenses = [
  new Expense({
    amount: 45000,
    currency: 'COP',
    description: 'Supermercado',
    category: 'alimentacion',
    accountId: 'test-account-1',
    budgetId: 'test-budget-1',
    date: '2024-01-15',
    tags: ['comida', 'supermercado']
  }),
  new Expense({
    amount: 25000,
    currency: 'COP',
    description: 'Uber',
    category: 'transporte',
    accountId: 'test-account-1',
    budgetId: 'test-budget-1',
    date: '2024-01-16',
    tags: ['transporte', 'uber']
  }),
  new Expense({
    amount: 120000,
    currency: 'COP',
    description: 'Arriendo',
    category: 'vivienda',
    accountId: 'test-account-1',
    budgetId: 'test-budget-1',
    date: '2024-01-01',
    tags: ['vivienda', 'arriendo'],
    isRecurring: true,
    recurringPattern: 'monthly'
  }),
  new Expense({
    amount: 35000,
    currency: 'COP',
    description: 'Cine',
    category: 'entretenimiento',
    accountId: 'test-account-1',
    budgetId: 'test-budget-1',
    date: '2024-01-20',
    tags: ['entretenimiento', 'cine']
  })
];

module.exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { httpMethod, pathParameters, body, queryStringParameters } = event;
    const expenseId = pathParameters?.id;

    switch (httpMethod) {
      case 'GET':
        if (expenseId) {
          // Obtener un gasto específico
          const expense = expenses.find(exp => exp.id === expenseId);
          if (!expense) {
            return {
              statusCode: 404,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ message: 'Gasto no encontrado' })
            };
          }
          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(expense.toJSON())
          };
        } else {
          // Obtener todos los gastos con filtros opcionales
          let filteredExpenses = expenses.filter(exp => exp.isActive);

          // Filtro por presupuesto
          if (queryStringParameters?.budgetId) {
            filteredExpenses = filteredExpenses.filter(exp => exp.budgetId === queryStringParameters.budgetId);
          }

          // Filtro por categoría
          if (queryStringParameters?.category) {
            filteredExpenses = filteredExpenses.filter(exp => exp.category === queryStringParameters.category);
          }

          // Filtro por cuenta
          if (queryStringParameters?.accountId) {
            filteredExpenses = filteredExpenses.filter(exp => exp.accountId === queryStringParameters.accountId);
          }

          // Filtro por fecha (desde)
          if (queryStringParameters?.dateFrom) {
            filteredExpenses = filteredExpenses.filter(exp => exp.date >= queryStringParameters.dateFrom);
          }

          // Filtro por fecha (hasta)
          if (queryStringParameters?.dateTo) {
            filteredExpenses = filteredExpenses.filter(exp => exp.date <= queryStringParameters.dateTo);
          }

          // Filtro por recurrencia
          if (queryStringParameters?.isRecurring !== undefined) {
            const isRecurring = queryStringParameters.isRecurring === 'true';
            filteredExpenses = filteredExpenses.filter(exp => exp.isRecurring === isRecurring);
          }

          // Calcular resumen por categoría
          const categorySummary = {};
          filteredExpenses.forEach(expense => {
            if (!categorySummary[expense.category]) {
              categorySummary[expense.category] = { count: 0, total: 0 };
            }
            categorySummary[expense.category].count += 1;
            categorySummary[expense.category].total += expense.amount;
          });

          // Calcular total general
          const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              expenses: filteredExpenses.map(exp => exp.toJSON()),
              total: filteredExpenses.length,
              totalAmount: totalAmount,
              categorySummary: categorySummary,
              availableCategories: Expense.getExpenseCategories(),
              availablePatterns: Expense.getRecurringPatterns(),
              availableCurrencies: Expense.getCurrencies()
            })
          };
        }

      case 'POST':
        // Crear nuevo gasto
        const expenseData = JSON.parse(body || '{}');
        console.log('Expense data received:', expenseData);
        
        const newExpense = new Expense(expenseData);
        console.log('Expense created:', newExpense);
        
        const validation = newExpense.validate();
        console.log('Validation result:', validation);
        
        if (!validation.isValid) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Datos de gasto inválidos',
              errors: validation.errors
            })
          };
        }

        expenses.push(newExpense);
        return {
          statusCode: 201,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newExpense.toJSON())
        };

      case 'PUT':
        // Actualizar gasto
        if (!expenseId) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'ID de gasto requerido' })
          };
        }

        const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
        if (expenseIndex === -1) {
          return {
            statusCode: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'Gasto no encontrado' })
          };
        }

        const updateData = JSON.parse(body || '{}');
        const updatedExpense = new Expense({
          ...expenses[expenseIndex],
          ...updateData,
          id: expenseId, // Mantener el ID original
          updatedAt: new Date().toISOString()
        });

        const updateValidation = updatedExpense.validate();
        if (!updateValidation.isValid) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Datos de gasto inválidos',
              errors: updateValidation.errors
            })
          };
        }

        expenses[expenseIndex] = updatedExpense;
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedExpense.toJSON())
        };

      case 'DELETE':
        // Eliminar gasto (soft delete)
        if (!expenseId) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'ID de gasto requerido' })
          };
        }

        const deleteIndex = expenses.findIndex(exp => exp.id === expenseId);
        if (deleteIndex === -1) {
          return {
            statusCode: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'Gasto no encontrado' })
          };
        }

        expenses[deleteIndex].isActive = false;
        expenses[deleteIndex].updatedAt = new Date().toISOString();

        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Gasto eliminado exitosamente' })
        };

      default:
        return {
          statusCode: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Método no permitido' })
        };
    }

  } catch (error) {
    console.error('Error en expenses handler:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Error interno del servidor',
        error: error.message
      })
    };
  }
};


