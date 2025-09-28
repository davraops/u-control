const { corsHeaders } = require('../middleware/cors');
const { v4: uuidv4 } = require('uuid');

// Simulamos una base de datos en memoria (en producción sería PostgreSQL)
let incomes = [
  {
    id: uuidv4(),
    amount: 5000000,
    currency: 'COP',
    description: 'Salario mensual',
    category: 'salario',
    accountId: 'test-account-1',
    date: '2024-01-15',
    tags: ['personal', 'recurrente'],
    isRecurring: true,
    recurringPattern: 'monthly',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    amount: 1500000,
    currency: 'COP',
    description: 'Proyecto freelance',
    category: 'freelance',
    accountId: 'test-account-2',
    date: '2024-01-10',
    tags: ['personal', 'temporal'],
    isRecurring: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    amount: 2000000,
    currency: 'COP',
    description: 'Dividendos de inversión',
    category: 'inversion',
    accountId: 'test-account-1',
    date: '2024-01-05',
    tags: ['personal', 'inversion'],
    isRecurring: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
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
    const incomeId = pathParameters?.id;

    switch (httpMethod) {
      case 'GET':
        if (incomeId) {
          // Obtener un ingreso específico
          const income = incomes.find(inc => inc.id === incomeId);
          if (!income) {
            return {
              statusCode: 404,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ message: 'Ingreso no encontrado' })
            };
          }
          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(income)
          };
        } else {
          // Obtener todos los ingresos con filtros opcionales
          let filteredIncomes = incomes.filter(inc => inc.isActive);

          // Filtro por cuenta
          if (queryStringParameters?.accountId) {
            filteredIncomes = filteredIncomes.filter(inc => inc.accountId === queryStringParameters.accountId);
          }

          // Filtro por categoría
          if (queryStringParameters?.category) {
            filteredIncomes = filteredIncomes.filter(inc => inc.category === queryStringParameters.category);
          }

          // Filtro por fecha (desde)
          if (queryStringParameters?.dateFrom) {
            filteredIncomes = filteredIncomes.filter(inc => inc.date >= queryStringParameters.dateFrom);
          }

          // Filtro por fecha (hasta)
          if (queryStringParameters?.dateTo) {
            filteredIncomes = filteredIncomes.filter(inc => inc.date <= queryStringParameters.dateTo);
          }

          // Calcular resumen por categoría
          const categorySummary = {};
          filteredIncomes.forEach(income => {
            if (!categorySummary[income.category]) {
              categorySummary[income.category] = { count: 0, total: 0 };
            }
            categorySummary[income.category].count += 1;
            categorySummary[income.category].total += income.amount;
          });

          // Calcular total general
          const totalAmount = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);

          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              incomes: filteredIncomes,
              total: filteredIncomes.length,
              totalAmount: totalAmount,
              categorySummary: categorySummary,
              availableCategories: ['salario', 'freelance', 'inversion', 'negocio', 'pension', 'subsidio', 'bonificacion', 'comision', 'alquiler', 'venta', 'otro'],
              availablePatterns: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
              availableCurrencies: [
                { value: 'COP', label: 'Peso Colombiano', symbol: '$' },
                { value: 'USD', label: 'Dólar Americano', symbol: '$' },
                { value: 'EUR', label: 'Euro', symbol: '€' },
                { value: 'MXN', label: 'Peso Mexicano', symbol: '$' },
                { value: 'ARS', label: 'Peso Argentino', symbol: '$' }
              ]
            })
          };
        }

      case 'POST':
        // Crear nuevo ingreso
        const incomeData = JSON.parse(body || '{}');
        const newIncome = {
          id: uuidv4(),
          amount: parseFloat(incomeData.amount) || 0,
          currency: incomeData.currency || 'COP',
          description: incomeData.description || '',
          category: incomeData.category || '',
          accountId: incomeData.accountId || '',
          date: incomeData.date || new Date().toISOString().split('T')[0],
          tags: incomeData.tags || [],
          isRecurring: incomeData.isRecurring || false,
          recurringPattern: incomeData.recurringPattern || null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Validación básica
        const errors = [];
        if (!newIncome.amount || newIncome.amount <= 0) {
          errors.push('El monto debe ser mayor a 0');
        }
        if (!newIncome.description || newIncome.description.trim().length === 0) {
          errors.push('La descripción es requerida');
        }
        if (!newIncome.category || newIncome.category.trim().length === 0) {
          errors.push('La categoría es requerida');
        }
        if (!newIncome.accountId || newIncome.accountId.trim().length === 0) {
          errors.push('El ID de cuenta es requerido');
        }

        if (errors.length > 0) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Datos de ingreso inválidos',
              errors: errors
            })
          };
        }

        incomes.push(newIncome);
        return {
          statusCode: 201,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newIncome)
        };

      case 'PUT':
        // Actualizar ingreso
        if (!incomeId) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'ID de ingreso requerido' })
          };
        }

        const incomeIndex = incomes.findIndex(inc => inc.id === incomeId);
        if (incomeIndex === -1) {
          return {
            statusCode: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'Ingreso no encontrado' })
          };
        }

        const updateData = JSON.parse(body || '{}');
        const updatedIncome = {
          ...incomes[incomeIndex],
          ...updateData,
          id: incomeId, // Mantener el ID original
          updatedAt: new Date().toISOString()
        };

        // Validación básica
        const updateErrors = [];
        if (updatedIncome.amount && updatedIncome.amount <= 0) {
          updateErrors.push('El monto debe ser mayor a 0');
        }
        if (updatedIncome.description && updatedIncome.description.trim().length === 0) {
          updateErrors.push('La descripción no puede estar vacía');
        }
        if (updatedIncome.category && updatedIncome.category.trim().length === 0) {
          updateErrors.push('La categoría no puede estar vacía');
        }
        if (updatedIncome.accountId && updatedIncome.accountId.trim().length === 0) {
          updateErrors.push('El ID de cuenta no puede estar vacío');
        }

        if (updateErrors.length > 0) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Datos de ingreso inválidos',
              errors: updateErrors
            })
          };
        }

        incomes[incomeIndex] = updatedIncome;
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedIncome)
        };

      case 'DELETE':
        // Eliminar ingreso (soft delete)
        if (!incomeId) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'ID de ingreso requerido' })
          };
        }

        const deleteIndex = incomes.findIndex(inc => inc.id === incomeId);
        if (deleteIndex === -1) {
          return {
            statusCode: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'Ingreso no encontrado' })
          };
        }

        incomes[deleteIndex].isActive = false;
        incomes[deleteIndex].updatedAt = new Date().toISOString();

        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Ingreso eliminado exitosamente' })
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
    console.error('Error en incomes handler:', error);
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


