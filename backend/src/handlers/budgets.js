const { corsHeaders } = require('../middleware/cors');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// Simulamos una base de datos en memoria (en producción sería PostgreSQL)
let budgets = [
  new Budget({
    month: '2024-01',
    year: 2024,
    categories: [
      { category: 'alimentacion', budgeted: 500000, spent: 0, remaining: 500000, percentage: 0 },
      { category: 'transporte', budgeted: 200000, spent: 0, remaining: 200000, percentage: 0 },
      { category: 'vivienda', budgeted: 800000, spent: 0, remaining: 800000, percentage: 0 },
      { category: 'entretenimiento', budgeted: 150000, spent: 0, remaining: 150000, percentage: 0 }
    ],
    status: 'active',
    isDefault: true // Este será nuestro presupuesto por defecto
  })
];

let expenses = [
  new Expense({
    amount: 45000,
    currency: 'COP',
    description: 'Supermercado',
    category: 'alimentacion',
    accountId: 'test-account-1',
    budgetId: budgets[0].id,
    date: '2024-01-15',
    tags: ['comida', 'supermercado']
  }),
  new Expense({
    amount: 25000,
    currency: 'COP',
    description: 'Uber',
    category: 'transporte',
    accountId: 'test-account-1',
    budgetId: budgets[0].id,
    date: '2024-01-16',
    tags: ['transporte', 'uber']
  })
];

// Helper function to calculate spent amounts for budgets
const calculateBudgetSpent = (budgetId) => {
  const budgetExpenses = expenses.filter(exp => exp.budgetId === budgetId && exp.isActive);
  const categorySpent = {};
  
  budgetExpenses.forEach(expense => {
    if (!categorySpent[expense.category]) {
      categorySpent[expense.category] = 0;
    }
    categorySpent[expense.category] += expense.amount;
  });
  
  return categorySpent;
};

// Helper function to update budget with spent amounts
const updateBudgetSpent = (budget) => {
  const categorySpent = calculateBudgetSpent(budget.id);
  
  budget.categories.forEach(category => {
    category.spent = categorySpent[category.category] || 0;
  });
  
  budget.calculateTotals();
  return budget;
};

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
    const budgetId = pathParameters?.id;

    switch (httpMethod) {
      case 'GET':
        if (budgetId) {
          // Endpoint especial para obtener presupuesto por defecto
          if (budgetId === 'default') {
            const defaultBudget = budgets.find(b => b.isDefault && b.isActive);
            if (!defaultBudget) {
              return {
                statusCode: 404,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: 'No hay presupuesto por defecto configurado' })
              };
            }
            
            const updatedDefaultBudget = updateBudgetSpent(defaultBudget);
            return {
              statusCode: 200,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(updatedDefaultBudget.toJSON())
            };
          }

          // Endpoint especial para crear presupuesto desde el por defecto
          if (budgetId === 'create-from-default') {
            const targetMonth = queryStringParameters?.month || Budget.getCurrentMonth();
            const targetYear = queryStringParameters?.year || new Date().getFullYear();
            
            const defaultBudget = budgets.find(b => b.isDefault && b.isActive);
            if (!defaultBudget) {
              return {
                statusCode: 404,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: 'No hay presupuesto por defecto configurado' })
              };
            }

            // Verificar que no exista ya un presupuesto para ese mes
            const existingBudget = budgets.find(b => b.month === targetMonth && b.isActive);
            if (existingBudget) {
              return {
                statusCode: 409,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  message: 'Ya existe un presupuesto para este mes',
                  existingBudget: existingBudget.toJSON()
                })
              };
            }

            const newBudget = Budget.createFromDefault(defaultBudget, targetMonth, targetYear);
            budgets.push(newBudget);
            
            return {
              statusCode: 201,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(newBudget.toJSON())
            };
          }

          // Obtener un presupuesto específico
          const budget = budgets.find(b => b.id === budgetId);
          if (!budget) {
            return {
              statusCode: 404,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ message: 'Presupuesto no encontrado' })
            };
          }
          
          const updatedBudget = updateBudgetSpent(budget);
          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedBudget.toJSON())
          };
        } else {
          // Obtener todos los presupuestos con filtros opcionales
          let filteredBudgets = budgets.filter(b => b.isActive);

          // Filtro por mes
          if (queryStringParameters?.month) {
            filteredBudgets = filteredBudgets.filter(b => b.month === queryStringParameters.month);
          }

          // Filtro por año
          if (queryStringParameters?.year) {
            filteredBudgets = filteredBudgets.filter(b => b.year === parseInt(queryStringParameters.year));
          }

          // Filtro por estado
          if (queryStringParameters?.status) {
            filteredBudgets = filteredBudgets.filter(b => b.status === queryStringParameters.status);
          }

          // Actualizar gastos para cada presupuesto
          const updatedBudgets = filteredBudgets.map(budget => updateBudgetSpent(budget));

          // Calcular resumen general
          const totalBudgets = updatedBudgets.length;
          const totalBudgeted = updatedBudgets.reduce((sum, b) => sum + b.totalBudgeted, 0);
          const totalSpent = updatedBudgets.reduce((sum, b) => sum + b.totalSpent, 0);
          const totalRemaining = totalBudgeted - totalSpent;

          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              budgets: updatedBudgets.map(b => b.toJSON()),
              total: totalBudgets,
              totalBudgeted: totalBudgeted,
              totalSpent: totalSpent,
              totalRemaining: totalRemaining,
              availableCategories: Budget.getBudgetCategories(),
              availableStatuses: Budget.getBudgetStatuses(),
              currentMonth: Budget.getCurrentMonth()
            })
          };
        }

      case 'POST':
        // Crear nuevo presupuesto
        const budgetData = JSON.parse(body || '{}');
        const newBudget = new Budget(budgetData);
        
        const validation = newBudget.validate();
        if (!validation.isValid) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Datos de presupuesto inválidos',
              errors: validation.errors
            })
          };
        }

        // Verificar que no exista un presupuesto para el mismo mes
        const existingBudget = budgets.find(b => b.month === newBudget.month && b.isActive);
        if (existingBudget) {
          return {
            statusCode: 409,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Ya existe un presupuesto para este mes',
              existingBudget: existingBudget.toJSON()
            })
          };
        }

        newBudget.calculateTotals();
        budgets.push(newBudget);
        
        return {
          statusCode: 201,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newBudget.toJSON())
        };

      case 'PUT':
        // Endpoint especial para establecer como presupuesto por defecto
        if (budgetId === 'set-default') {
          const { budgetId: targetBudgetId } = JSON.parse(body || '{}');
          
          if (!targetBudgetId) {
            return {
              statusCode: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ message: 'ID de presupuesto requerido' })
            };
          }

          const targetBudget = budgets.find(b => b.id === targetBudgetId);
          if (!targetBudget) {
            return {
              statusCode: 404,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ message: 'Presupuesto no encontrado' })
            };
          }

          // Quitar el flag de por defecto de todos los presupuestos
          budgets.forEach(budget => {
            if (budget.isDefault) {
              budget.isDefault = false;
              budget.updatedAt = new Date().toISOString();
            }
          });

          // Establecer el presupuesto seleccionado como por defecto
          targetBudget.isDefault = true;
          targetBudget.updatedAt = new Date().toISOString();

          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Presupuesto establecido como por defecto',
              budget: targetBudget.toJSON()
            })
          };
        }

        // Actualizar presupuesto
        if (!budgetId) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'ID de presupuesto requerido' })
          };
        }

        const budgetIndex = budgets.findIndex(b => b.id === budgetId);
        if (budgetIndex === -1) {
          return {
            statusCode: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'Presupuesto no encontrado' })
          };
        }

        const updateData = JSON.parse(body || '{}');
        const updatedBudget = new Budget({
          ...budgets[budgetIndex],
          ...updateData,
          id: budgetId, // Mantener el ID original
          updatedAt: new Date().toISOString()
        });

        const updateValidation = updatedBudget.validate();
        if (!updateValidation.isValid) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Datos de presupuesto inválidos',
              errors: updateValidation.errors
            })
          };
        }

        updatedBudget.calculateTotals();
        budgets[budgetIndex] = updatedBudget;
        
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedBudget.toJSON())
        };

      case 'DELETE':
        // Eliminar presupuesto (soft delete)
        if (!budgetId) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'ID de presupuesto requerido' })
          };
        }

        const deleteIndex = budgets.findIndex(b => b.id === budgetId);
        if (deleteIndex === -1) {
          return {
            statusCode: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'Presupuesto no encontrado' })
          };
        }

        budgets[deleteIndex].isActive = false;
        budgets[deleteIndex].updatedAt = new Date().toISOString();

        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Presupuesto eliminado exitosamente' })
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
    console.error('Error en budgets handler:', error);
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
