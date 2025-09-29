// Utility functions for the frontend
const API_BASE_URL = 'http://localhost:3001/dev';

// Global state
let accounts = [];
let incomes = [];
let expenses = [];
let budgets = [];
let editingItem = null;

// API call function
async function apiCall(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

// Show success message
function showSuccess(message) {
  // In a real app, this would show a toast or notification
  console.log('Success:', message);
}

// Show error message
function showError(message) {
  // In a real app, this would show an error toast or notification
  console.error('Error:', message);
}

// Validate account data
function validateAccount(accountData) {
  const errors = [];
  
  if (!accountData.name || accountData.name.trim().length === 0) {
    errors.push('El nombre es requerido');
  }
  
  if (!accountData.type || accountData.type.trim().length === 0) {
    errors.push('El tipo es requerido');
  }
  
  if (accountData.balance === undefined || accountData.balance === null) {
    errors.push('El saldo es requerido');
  }
  
  if (accountData.balance < 0) {
    errors.push('El saldo no puede ser negativo');
  }
  
  if (!accountData.currency || accountData.currency.length !== 3) {
    errors.push('La moneda debe ser un código de 3 letras');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate income data
function validateIncome(incomeData) {
  const errors = [];
  
  if (!incomeData.description || incomeData.description.trim().length === 0) {
    errors.push('La descripción es requerida');
  }
  
  if (!incomeData.amount || incomeData.amount <= 0) {
    errors.push('El monto debe ser mayor a 0');
  }
  
  if (!incomeData.category || incomeData.category.trim().length === 0) {
    errors.push('La categoría es requerida');
  }
  
  if (!incomeData.accountId || incomeData.accountId.trim().length === 0) {
    errors.push('La cuenta es requerida');
  }
  
  if (!incomeData.date || !/^\d{4}-\d{2}-\d{2}$/.test(incomeData.date)) {
    errors.push('La fecha es requerida y debe estar en formato YYYY-MM-DD');
  }
  
  if (!incomeData.currency || incomeData.currency.length !== 3) {
    errors.push('La moneda debe ser un código de 3 letras');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate expense data
function validateExpense(expenseData) {
  const errors = [];
  
  if (!expenseData.description || expenseData.description.trim().length === 0) {
    errors.push('La descripción es requerida');
  }
  
  if (!expenseData.amount || expenseData.amount <= 0) {
    errors.push('El monto debe ser mayor a 0');
  }
  
  if (!expenseData.category || expenseData.category.trim().length === 0) {
    errors.push('La categoría es requerida');
  }
  
  if (!expenseData.accountId || expenseData.accountId.trim().length === 0) {
    errors.push('La cuenta es requerida');
  }
  
  if (!expenseData.date || !/^\d{4}-\d{2}-\d{2}$/.test(expenseData.date)) {
    errors.push('La fecha es requerida y debe estar en formato YYYY-MM-DD');
  }
  
  if (!expenseData.currency || expenseData.currency.length !== 3) {
    errors.push('La moneda debe ser un código de 3 letras');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate budget data
function validateBudget(budgetData) {
  const errors = [];
  
  if (!budgetData.month || !/^\d{4}-\d{2}$/.test(budgetData.month)) {
    errors.push('El mes debe estar en formato YYYY-MM');
  }
  
  if (!budgetData.year || budgetData.year < 2020 || budgetData.year > 2030) {
    errors.push('El año debe estar entre 2020 y 2030');
  }
  
  if (!Array.isArray(budgetData.categories) || budgetData.categories.length === 0) {
    errors.push('Debe incluir al menos una categoría de presupuesto');
  }
  
  if (budgetData.categories) {
    budgetData.categories.forEach((category, index) => {
      if (!category.category || category.category.trim().length === 0) {
        errors.push(`La categoría en la posición ${index + 1} es requerida`);
      }
      if (!category.budgeted || category.budgeted < 0) {
        errors.push(`El presupuesto para la categoría ${category.category} debe ser mayor o igual a 0`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Calculate dashboard totals
function calculateDashboardTotals() {
  const totalAccounts = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  const totalIncomes = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalBudgets = budgets.reduce((sum, budget) => sum + (budget.totalBudgeted || 0), 0);
  
  return {
    totalAccounts,
    totalIncomes,
    totalExpenses,
    totalBudgets,
    netWorth: totalAccounts + totalIncomes - totalExpenses
  };
}

module.exports = {
  API_BASE_URL,
  accounts,
  incomes,
  expenses,
  budgets,
  editingItem,
  apiCall,
  formatCurrency,
  showSuccess,
  showError,
  validateAccount,
  validateIncome,
  validateExpense,
  validateBudget,
  calculateDashboardTotals
};
