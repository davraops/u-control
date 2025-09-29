const { corsHeaders } = require('../middleware/cors');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// Helper function to get total income for a specific month
const getTotalIncomeForMonth = (month, year) => {
  // Por ahora usamos datos simulados, pero en producción esto vendría de la base de datos
  const sampleIncomes = [
    { amount: 3000000, date: '2024-01-01', currency: 'COP' },
    { amount: 500000, date: '2024-01-15', currency: 'COP' },
    { amount: 200000, date: '2024-01-20', currency: 'COP' }
  ];
  
  console.log(`getTotalIncomeForMonth called with month=${month}, year=${year}`);
  
  // Filtrar ingresos del mes específico
  const monthIncomes = sampleIncomes.filter(income => {
    const incomeDate = new Date(income.date);
    const incomeYear = incomeDate.getFullYear();
    const incomeMonth = (incomeDate.getMonth() + 1).toString().padStart(2, '0');
    const targetMonth = month.split('-')[1];
    
    console.log(`Checking income ${income.date}: year=${incomeYear} vs ${year}, month=${incomeMonth} vs ${targetMonth}`);
    
    return incomeYear === year && incomeMonth === targetMonth;
  });
  
  const total = monthIncomes.reduce((total, income) => total + income.amount, 0);
  console.log(`getTotalIncomeForMonth(${month}, ${year}): found ${monthIncomes.length} incomes, total=${total}`);
  return total;
};

// Helper function to check if a budget is in the active period
const isBudgetInActivePeriod = (budget) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
  
  const budgetYear = budget.year;
  const budgetMonth = parseInt(budget.month.split('-')[1]);
  
  console.log(`Checking budget period: ${budgetYear}-${budgetMonth} vs current: ${currentYear}-${currentMonth}`);
  
  // Check if budget is for current month and year
  if (budgetYear === currentYear && budgetMonth === currentMonth) {
    console.log('Budget is for current month');
    return true;
  }
  
  // Check if budget is for a future month in the current year
  if (budgetYear === currentYear && budgetMonth > currentMonth) {
    console.log('Budget is for future month in current year');
    return true;
  }
  
  // Check if budget is for a past month in the current year (within last 3 months)
  if (budgetYear === currentYear && budgetMonth >= currentMonth - 3) {
    console.log('Budget is for past month within last 3 months');
    return true;
  }
  
  // Check if budget is for next year (January only)
  if (budgetYear === currentYear + 1 && budgetMonth === 1) {
    console.log('Budget is for January of next year');
    return true;
  }
  
  // Check if budget is for a past year (not allowed)
  if (budgetYear < currentYear) {
    console.log('Budget is for past year - not allowed');
    return false;
  }
  
  // Check if budget is for a future year beyond next year (not allowed)
  if (budgetYear > currentYear + 1) {
    console.log('Budget is for future year beyond next year - not allowed');
    return false;
  }
  
  console.log('Budget period is not in active range');
  return false;
};

// Simulamos una base de datos en memoria (en producción sería PostgreSQL)
let budgets = [
  new Budget({
    month: '2024-01',
    year: 2024,
    name: 'Presupuesto Personal Enero 2024',
    categories: [
      { category: 'alimentacion', budgeted: 500000, spent: 45000, remaining: 455000, percentage: 9 },
      { category: 'transporte', budgeted: 200000, spent: 25000, remaining: 175000, percentage: 13 },
      { category: 'vivienda', budgeted: 800000, spent: 0, remaining: 800000, percentage: 0 },
      { category: 'entretenimiento', budgeted: 150000, spent: 0, remaining: 150000, percentage: 0 }
    ],
    status: 'active',
    isDefault: true, // Este será nuestro presupuesto por defecto
    totalIncome: 3700000,
    budgetPercentageOfIncome: 45
  }),
  new Budget({
    month: '2024-02',
    year: 2024,
    name: 'Presupuesto Personal Febrero 2024',
    categories: [
      { category: 'alimentacion', budgeted: 450000, spent: 0, remaining: 450000, percentage: 0 },
      { category: 'transporte', budgeted: 180000, spent: 0, remaining: 180000, percentage: 0 },
      { category: 'vivienda', budgeted: 800000, spent: 0, remaining: 800000, percentage: 0 },
      { category: 'salud', budgeted: 100000, spent: 0, remaining: 100000, percentage: 0 },
      { category: 'entretenimiento', budgeted: 120000, spent: 0, remaining: 120000, percentage: 0 }
    ],
    status: 'active',
    isDefault: false,
    totalIncome: 3500000,
    budgetPercentageOfIncome: 47
  }),
  new Budget({
    month: '2024-03',
    year: 2024,
    name: 'Presupuesto Empresarial Marzo 2024',
    categories: [
      { category: 'alimentacion', budgeted: 300000, spent: 0, remaining: 300000, percentage: 0 },
      { category: 'transporte', budgeted: 150000, spent: 0, remaining: 150000, percentage: 0 },
      { category: 'vivienda', budgeted: 600000, spent: 0, remaining: 600000, percentage: 0 },
      { category: 'educacion', budgeted: 200000, spent: 0, remaining: 200000, percentage: 0 },
      { category: 'ahorro', budgeted: 500000, spent: 0, remaining: 500000, percentage: 0 }
    ],
    status: 'draft',
    isDefault: false,
    totalIncome: 4000000,
    budgetPercentageOfIncome: 44
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

// Helper function to get total income for a specific period
const getTotalIncomeForPeriod = (periodStart, periodEnd) => {
  // Por ahora usamos datos simulados, pero en producción esto vendría de la base de datos
  const sampleIncomes = [
    { amount: 3000000, date: '2024-01-01', currency: 'COP' },
    { amount: 500000, date: '2024-01-15', currency: 'COP' },
    { amount: 200000, date: '2024-01-20', currency: 'COP' },
    { amount: 1500000, date: '2024-02-01', currency: 'COP' },
    { amount: 800000, date: '2024-02-15', currency: 'COP' },
    { amount: 1200000, date: '2024-03-01', currency: 'COP' }
  ];
  
  console.log(`getTotalIncomeForPeriod called with periodStart=${periodStart}, periodEnd=${periodEnd}`);
  
  // Filtrar ingresos del período específico
  const periodIncomes = sampleIncomes.filter(income => {
    const incomeDate = new Date(income.date);
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    
    console.log(`Checking income ${income.date}: ${incomeDate} between ${startDate} and ${endDate}`);
    
    return incomeDate >= startDate && incomeDate <= endDate;
  });
  
  const total = periodIncomes.reduce((total, income) => total + income.amount, 0);
  console.log(`getTotalIncomeForPeriod(${periodStart}, ${periodEnd}): found ${periodIncomes.length} incomes, total=${total}`);
  return total;
};

// Helper function to update budget with spent amounts
const updateBudgetSpent = (budget) => {
  const categorySpent = calculateBudgetSpent(budget.id);
  
  // Obtener total de ingresos del período
  const totalIncome = getTotalIncomeForPeriod(budget.periodStart, budget.periodEnd);
  
  // Si es presupuesto porcentual, recalcular el monto basado en ingresos reales
  if (budget.budgetType === 'percentage' && budget.percentage && totalIncome > 0) {
    const calculatedAmount = Math.round((totalIncome * budget.percentage) / 100);
    
    // Actualizar el monto presupuestado en cada categoría
    budget.categories.forEach(category => {
      category.budgeted = calculatedAmount;
    });
    
    // Recalcular totales
    budget.totalBudgeted = calculatedAmount;
  }
  
  budget.categories.forEach(category => {
    category.spent = categorySpent[category.category] || 0;
  });
  
  budget.calculateTotals();
  
  // Calcular porcentaje del presupuesto respecto a las ganancias
  const budgetPercentageOfIncome = totalIncome > 0 ? 
    Math.round((budget.totalBudgeted / totalIncome) * 100) : 0;
  
  // Agregar información del porcentaje de ganancias directamente al objeto
  budget.totalIncome = totalIncome;
  budget.budgetPercentageOfIncome = budgetPercentageOfIncome;
  
  console.log(`Budget ${budget.month}: totalIncome=${totalIncome}, budgetPercentageOfIncome=${budgetPercentageOfIncome}, totalBudgeted=${budget.totalBudgeted}, budgetType=${budget.budgetType}`);
  if (budget.budgetType === 'percentage') {
    console.log(`Percentage budget: ${budget.percentage}% of ${totalIncome} = ${budget.totalBudgeted}`);
  }
  
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
        console.log('Budget data received:', JSON.stringify(budgetData, null, 2));
        const newBudget = new Budget(budgetData);
        console.log('Budget created:', JSON.stringify(newBudget, null, 2));
        
        const validation = newBudget.validate();
        console.log('Validation result:', validation);
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

        // Verificar que no exista un presupuesto con el mismo nombre para el mismo período
        const existingBudget = budgets.find(b => 
          b.month === newBudget.month && 
          b.year === newBudget.year && 
          b.name === newBudget.name && 
          b.isActive
        );
        if (existingBudget) {
          return {
            statusCode: 409,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `Ya existe un presupuesto con el nombre "${newBudget.name}" para ${newBudget.month} ${newBudget.year}`,
              existingBudget: existingBudget.toJSON()
            })
          };
        }

        // Actualizar el presupuesto con los cálculos de porcentaje
        const updatedBudget = updateBudgetSpent(newBudget);
        budgets.push(updatedBudget);
        
        console.log('New budget created:', updatedBudget.toJSON());
        console.log('Budget object after updateBudgetSpent:', {
          totalIncome: updatedBudget.totalIncome,
          budgetPercentageOfIncome: updatedBudget.budgetPercentageOfIncome
        });
        
        return {
          statusCode: 201,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedBudget.toJSON())
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
        console.log('Update data:', updateData);
        console.log('Current budget:', budgets[budgetIndex]);
        
        const budgetToUpdate = new Budget({
          ...budgets[budgetIndex],
          ...updateData,
          id: budgetId, // Mantener el ID original
          updatedAt: new Date().toISOString()
        });
        
        console.log('Budget to update created successfully');
        
        // Check if trying to activate a budget that's not in the active period
        console.log('Checking if trying to activate budget:', updateData.status === 'active');
        if (updateData.status === 'active') {
          console.log('Budget is being activated, checking period...');
          const isInActivePeriod = isBudgetInActivePeriod(budgetToUpdate);
          console.log('Is budget in active period?', isInActivePeriod);
          
          if (!isInActivePeriod) {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();
            
            console.log('Budget is not in active period, returning error');
            return {
              statusCode: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: 'No se puede activar el presupuesto',
                error: `El presupuesto "${budgetToUpdate.name || budgetToUpdate.month}" está configurado para ${budgetToUpdate.month}/${budgetToUpdate.year}, pero el período activo actual es ${currentYear}-${String(currentMonth).padStart(2, '0')}. Es necesario editar el presupuesto para que incluya el período en acción.`
              })
            };
          }
        }

        const updateValidation = budgetToUpdate.validate();
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

        budgetToUpdate.calculateTotals();
        budgets[budgetIndex] = budgetToUpdate;
        
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(budgetToUpdate.toJSON())
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
