const { v4: uuidv4 } = require('uuid');

class Account {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.type = data.type; // checking, savings, investment, cash, credit
    this.bank = data.bank;
    this.accountNumber = data.accountNumber;
    this.balance = parseFloat(data.balance) || 0;
    this.currency = data.currency || 'COP';
    this.tags = data.tags || []; // Array de tags: ['personal', 'empresa', 'inversion', etc.]
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('El nombre de la cuenta es requerido');
    }

    if (!this.type || !['checking', 'savings', 'investment', 'cash', 'credit'].includes(this.type)) {
      errors.push('El tipo de cuenta debe ser: checking, savings, investment, cash, o credit');
    }

    if (this.type !== 'cash' && (!this.bank || this.bank.trim().length === 0)) {
      errors.push('El banco es requerido para cuentas no efectivo');
    }

    if (this.balance < 0) {
      errors.push('El saldo no puede ser negativo');
    }

    if (!this.currency || this.currency.length !== 3) {
      errors.push('La moneda debe ser un código de 3 letras (ej: COP, USD)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      bank: this.bank,
      accountNumber: this.accountNumber,
      balance: this.balance,
      currency: this.currency,
      tags: this.tags,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static getAccountTypes() {
    return [
      { value: 'checking', label: 'Cuenta Corriente', icon: '🏦' },
      { value: 'savings', label: 'Cuenta de Ahorros', icon: '💰' },
      { value: 'investment', label: 'Inversión', icon: '📈' },
      { value: 'cash', label: 'Efectivo', icon: '💵' },
      { value: 'credit', label: 'Tarjeta de Crédito', icon: '💳' }
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

  static getAvailableTags() {
    return [
      { value: 'personal', label: 'Personal', color: 'primary', icon: '👤' },
      { value: 'empresa', label: 'Empresa', color: 'secondary', icon: '🏢' },
      { value: 'inversion', label: 'Inversión', color: 'success', icon: '📈' },
      { value: 'ahorro', label: 'Ahorro', color: 'info', icon: '💰' },
      { value: 'emergencia', label: 'Emergencia', color: 'warning', icon: '🚨' },
      { value: 'gastos', label: 'Gastos', color: 'error', icon: '💸' }
    ];
  }
}

module.exports = Account;
