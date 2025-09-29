const {
  formatCurrency,
  validateAccount,
  validateIncome,
  validateExpense,
  validateBudget,
  calculateDashboardTotals
} = require('../utils');

describe('Frontend Utils', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000000)).toMatch(/\$.*1\.000\.000/);
      expect(formatCurrency(50000)).toMatch(/\$.*50\.000/);
      expect(formatCurrency(0)).toMatch(/\$.*0/);
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-100000)).toMatch(/-.*100\.000/);
    });
  });

  describe('validateAccount', () => {
    it('should validate correct account data', () => {
      const validAccount = {
        name: 'Test Account',
        type: 'checking',
        balance: 1000000,
        currency: 'COP'
      };

      const result = validateAccount(validAccount);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid account data', () => {
      const invalidAccount = {
        name: '',
        type: '',
        balance: -1000,
        currency: 'INVALID'
      };

      const result = validateAccount(invalidAccount);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre es requerido');
      expect(result.errors).toContain('El tipo es requerido');
      expect(result.errors).toContain('El saldo no puede ser negativo');
      expect(result.errors).toContain('La moneda debe ser un código de 3 letras');
    });

    it('should require all fields', () => {
      const incompleteAccount = {};

      const result = validateAccount(incompleteAccount);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre es requerido');
      expect(result.errors).toContain('El tipo es requerido');
      expect(result.errors).toContain('El saldo es requerido');
      expect(result.errors).toContain('La moneda debe ser un código de 3 letras');
    });
  });

  describe('validateIncome', () => {
    it('should validate correct income data', () => {
      const validIncome = {
        description: 'Test Income',
        amount: 2000000,
        category: 'salario',
        accountId: 'test-account-1',
        date: '2024-01-15',
        currency: 'COP'
      };

      const result = validateIncome(validIncome);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid income data', () => {
      const invalidIncome = {
        description: '',
        amount: -1000,
        category: '',
        accountId: '',
        date: 'invalid-date',
        currency: 'INVALID'
      };

      const result = validateIncome(invalidIncome);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La descripción es requerida');
      expect(result.errors).toContain('El monto debe ser mayor a 0');
      expect(result.errors).toContain('La categoría es requerida');
      expect(result.errors).toContain('La cuenta es requerida');
      expect(result.errors).toContain('La fecha es requerida y debe estar en formato YYYY-MM-DD');
      expect(result.errors).toContain('La moneda debe ser un código de 3 letras');
    });
  });

  describe('validateExpense', () => {
    it('should validate correct expense data', () => {
      const validExpense = {
        description: 'Test Expense',
        amount: 50000,
        category: 'alimentacion',
        accountId: 'test-account-1',
        date: '2024-01-15',
        currency: 'COP'
      };

      const result = validateExpense(validExpense);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid expense data', () => {
      const invalidExpense = {
        description: '',
        amount: -1000,
        category: '',
        accountId: '',
        date: 'invalid-date',
        currency: 'INVALID'
      };

      const result = validateExpense(invalidExpense);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La descripción es requerida');
      expect(result.errors).toContain('El monto debe ser mayor a 0');
      expect(result.errors).toContain('La categoría es requerida');
      expect(result.errors).toContain('La cuenta es requerida');
      expect(result.errors).toContain('La fecha es requerida y debe estar en formato YYYY-MM-DD');
      expect(result.errors).toContain('La moneda debe ser un código de 3 letras');
    });
  });

  describe('validateBudget', () => {
    it('should validate correct budget data', () => {
      const validBudget = {
        month: '2024-01',
        year: 2024,
        categories: [
          {
            category: 'alimentacion',
            budgeted: 500000
          }
        ]
      };

      const result = validateBudget(validBudget);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid budget data', () => {
      const invalidBudget = {
        month: 'invalid-month',
        year: 2019,
        categories: []
      };

      const result = validateBudget(invalidBudget);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El mes debe estar en formato YYYY-MM');
      expect(result.errors).toContain('El año debe estar entre 2020 y 2030');
      expect(result.errors).toContain('Debe incluir al menos una categoría de presupuesto');
    });

    it('should validate category data', () => {
      const budgetWithInvalidCategories = {
        month: '2024-01',
        year: 2024,
        categories: [
          {
            category: '',
            budgeted: -1000
          }
        ]
      };

      const result = validateBudget(budgetWithInvalidCategories);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La categoría en la posición 1 es requerida');
      expect(result.errors).toContain('El presupuesto para la categoría  debe ser mayor o igual a 0');
    });
  });

  describe('calculateDashboardTotals', () => {
    it('should calculate totals correctly', () => {
      // Mock the module's arrays directly
      const { accounts, incomes, expenses, budgets } = require('../utils');
      
      // Set test data
      accounts.length = 0;
      accounts.push(
        { balance: 1000000 },
        { balance: 500000 }
      );
      
      incomes.length = 0;
      incomes.push(
        { amount: 2000000 },
        { amount: 1000000 }
      );
      
      expenses.length = 0;
      expenses.push(
        { amount: 300000 },
        { amount: 200000 }
      );
      
      budgets.length = 0;
      budgets.push(
        { totalBudgeted: 1500000 },
        { totalBudgeted: 800000 }
      );

      const totals = calculateDashboardTotals();
      
      expect(totals.totalAccounts).toBe(1500000);
      expect(totals.totalIncomes).toBe(3000000);
      expect(totals.totalExpenses).toBe(500000);
      expect(totals.totalBudgets).toBe(2300000);
      expect(totals.netWorth).toBe(4000000); // 1500000 + 3000000 - 500000
    });

    it('should handle empty arrays', () => {
      const { accounts, incomes, expenses, budgets } = require('../utils');
      
      accounts.length = 0;
      incomes.length = 0;
      expenses.length = 0;
      budgets.length = 0;

      const totals = calculateDashboardTotals();
      
      expect(totals.totalAccounts).toBe(0);
      expect(totals.totalIncomes).toBe(0);
      expect(totals.totalExpenses).toBe(0);
      expect(totals.totalBudgets).toBe(0);
      expect(totals.netWorth).toBe(0);
    });

    it('should handle undefined values', () => {
      const { accounts, incomes, expenses, budgets } = require('../utils');
      
      accounts.length = 0;
      accounts.push({ balance: undefined }, { balance: null });
      
      incomes.length = 0;
      incomes.push({ amount: undefined }, { amount: null });
      
      expenses.length = 0;
      expenses.push({ amount: undefined }, { amount: null });
      
      budgets.length = 0;
      budgets.push({ totalBudgeted: undefined }, { totalBudgeted: null });

      const totals = calculateDashboardTotals();
      
      expect(totals.totalAccounts).toBe(0);
      expect(totals.totalIncomes).toBe(0);
      expect(totals.totalExpenses).toBe(0);
      expect(totals.totalBudgets).toBe(0);
      expect(totals.netWorth).toBe(0);
    });
  });
});
