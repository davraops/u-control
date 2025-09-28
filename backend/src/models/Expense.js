const { v4: uuidv4 } = require('uuid');

class Expense {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.amount = parseFloat(data.amount) || 0;
    this.currency = data.currency || 'COP';
    this.description = data.description;
    this.category = data.category; // Must match budget categories
    this.accountId = data.accountId;
    this.budgetId = data.budgetId; // Reference to Budget
    this.date = data.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.tags = data.tags || [];
    this.isRecurring = data.isRecurring || false;
    this.recurringPattern = data.recurringPattern; // daily, weekly, monthly, yearly
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  validate() {
    const errors = [];

    if (!this.amount || this.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('La descripción es requerida');
    }

    if (!this.category || !Expense.getExpenseCategories().some(cat => cat.value === this.category)) {
      errors.push('La categoría debe ser una de las categorías de presupuesto válidas');
    }

    if (!this.accountId || this.accountId.trim().length === 0) {
      errors.push('El ID de la cuenta es requerido');
    }

    // budgetId is optional - expenses can exist without being assigned to a budget
    if (this.budgetId && this.budgetId.trim().length === 0) {
      errors.push('El ID del presupuesto no puede estar vacío si se proporciona');
    }

    if (!this.currency || this.currency.length !== 3) {
      errors.push('La moneda debe ser un código de 3 letras (ej: COP, USD)');
    }

    if (!this.date || !/^\d{4}-\d{2}-\d{2}$/.test(this.date)) {
      errors.push('La fecha es requerida y debe estar en formato YYYY-MM-DD');
    }

    if (this.isRecurring && !this.recurringPattern) {
      errors.push('El patrón de recurrencia es requerido para gastos recurrentes');
    }

    if (this.recurringPattern && !['daily', 'weekly', 'monthly', 'yearly'].includes(this.recurringPattern)) {
      errors.push('El patrón de recurrencia debe ser: daily, weekly, monthly, o yearly');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      amount: this.amount,
      currency: this.currency,
      description: this.description,
      category: this.category,
      accountId: this.accountId,
      budgetId: this.budgetId,
      date: this.date,
      tags: this.tags,
      isRecurring: this.isRecurring,
      recurringPattern: this.recurringPattern,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static getExpenseCategories() {
    // Same categories as Budget for consistency
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

  static getRecurringPatterns() {
    return [
      { value: 'daily', label: 'Diario', icon: '📅' },
      { value: 'weekly', label: 'Semanal', icon: '📆' },
      { value: 'monthly', label: 'Mensual', icon: '🗓️' },
      { value: 'yearly', label: 'Anual', icon: '📊' }
    ];
  }

  static getCurrencies() {
    return [
      { value: 'COP', label: 'Peso Colombiano', symbol: '$' },
      { value: 'USD', label: 'Dólar Americano', symbol: '$' },
      { value: 'EUR', label: 'Euro', symbol: '€' },
      { value: 'MXN', label: 'Peso Mexicano', symbol: '$' },
      { value: 'ARS', label: 'Peso Argentino', symbol: '$' }
    ];
  }
}

module.exports = Expense;


