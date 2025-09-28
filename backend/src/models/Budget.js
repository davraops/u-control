const { v4: uuidv4 } = require('uuid');

class Budget {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.month = data.month; // YYYY-MM format (2024-01)
    this.year = data.year || new Date().getFullYear();
    this.categories = data.categories || []; // Array of category budgets
    this.totalBudgeted = data.totalBudgeted || 0;
    this.totalSpent = data.totalSpent || 0; // Calculated field
    this.totalRemaining = data.totalRemaining || 0; // Calculated field
    this.status = data.status || 'draft'; // draft, active, completed
    this.isDefault = data.isDefault || false; // If true, this budget will be used as template for new months
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  validate() {
    const errors = [];

    if (!this.month || !/^\d{4}-\d{2}$/.test(this.month)) {
      errors.push('El mes debe estar en formato YYYY-MM (ej: 2024-01)');
    }

    if (!this.year || this.year < 2020 || this.year > 2030) {
      errors.push('El año debe estar entre 2020 y 2030');
    }

    if (!Array.isArray(this.categories) || this.categories.length === 0) {
      errors.push('Debe incluir al menos una categoría de presupuesto');
    }

    // Validate each category
    this.categories.forEach((category, index) => {
      if (!category.category || !Budget.getBudgetCategories().some(cat => cat.value === category.category)) {
        errors.push(`Categoría inválida en la posición ${index + 1}`);
      }
      if (!category.budgeted || category.budgeted < 0) {
        errors.push(`El presupuesto para la categoría ${category.category} debe ser mayor o igual a 0`);
      }
    });

    if (!['draft', 'active', 'completed'].includes(this.status)) {
      errors.push('El estado debe ser: draft, active, o completed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  calculateTotals() {
    this.totalBudgeted = this.categories.reduce((sum, cat) => sum + (cat.budgeted || 0), 0);
    this.totalSpent = this.categories.reduce((sum, cat) => sum + (cat.spent || 0), 0);
    this.totalRemaining = this.totalBudgeted - this.totalSpent;

    // Update category percentages
    this.categories.forEach(category => {
      if (category.budgeted > 0) {
        category.percentage = Math.round((category.spent / category.budgeted) * 100);
      } else {
        category.percentage = 0;
      }
      category.remaining = category.budgeted - (category.spent || 0);
    });
  }

  toJSON() {
    return {
      id: this.id,
      month: this.month,
      year: this.year,
      categories: this.categories,
      totalBudgeted: this.totalBudgeted,
      totalSpent: this.totalSpent,
      totalRemaining: this.totalRemaining,
      status: this.status,
      isDefault: this.isDefault,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static getBudgetCategories() {
    return [
      { value: 'alimentacion', label: 'Alimentación', icon: '🍽️', color: 'primary' },
      { value: 'transporte', label: 'Transporte', icon: '🚗', color: 'secondary' },
      { value: 'vivienda', label: 'Vivienda', icon: '🏠', color: 'success' },
      { value: 'salud', label: 'Salud', icon: '🏥', color: 'info' },
      { value: 'entretenimiento', label: 'Entretenimiento', icon: '🎬', color: 'warning' },
      { value: 'educacion', label: 'Educación', icon: '📚', color: 'error' },
      { value: 'ahorro', label: 'Ahorro', icon: '💰', color: 'default' },
      { value: 'otros', label: 'Otros', icon: '📦', color: 'default' }
    ];
  }

  static getBudgetStatuses() {
    return [
      { value: 'draft', label: 'Borrador', color: 'default' },
      { value: 'active', label: 'Activo', color: 'primary' },
      { value: 'completed', label: 'Completado', color: 'success' }
    ];
  }

  static getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  static getMonthName(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  }

  static createFromDefault(defaultBudget, targetMonth, targetYear) {
    const newBudget = new Budget({
      month: targetMonth,
      year: targetYear,
      categories: defaultBudget.categories.map(cat => ({
        category: cat.category,
        budgeted: cat.budgeted,
        spent: 0,
        remaining: cat.budgeted,
        percentage: 0
      })),
      status: 'draft',
      isDefault: false
    });
    
    newBudget.calculateTotals();
    return newBudget;
  }

  static getNextMonth(currentMonth) {
    const [year, month] = currentMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    date.setMonth(date.getMonth() + 1);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    return `${nextYear}-${nextMonth}`;
  }

  static getPreviousMonth(currentMonth) {
    const [year, month] = currentMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    date.setMonth(date.getMonth() - 1);
    const prevYear = date.getFullYear();
    const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
    return `${prevYear}-${prevMonth}`;
  }
}

module.exports = Budget;
