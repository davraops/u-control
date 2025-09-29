const { v4: uuidv4 } = require('uuid');

class Budget {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name || null; // Budget name
    console.log('Budget constructor - name:', this.name, 'from data:', data.name);
    this.month = data.month; // YYYY-MM format (2024-01)
    this.year = data.year || new Date().getFullYear();
    this.period = data.period || 'monthly'; // monthly, quarterly, semiannual, annual
    this.periodStart = data.periodStart || this.calculatePeriodStart(); // Start date of the budget period
    this.periodEnd = data.periodEnd || this.calculatePeriodEnd(); // End date of the budget period
    this.budgetType = data.budgetType || 'fixed'; // fixed, percentage
    this.percentage = data.percentage || null; // Percentage of income (only for percentage type)
    this.categories = data.categories || []; // Array of category budgets
    this.totalBudgeted = data.totalBudgeted || 0;
    this.totalSpent = data.totalSpent || 0; // Calculated field
    this.totalRemaining = data.totalRemaining || 0; // Calculated field
    this.status = data.status || 'draft'; // draft, active, completed
    this.isDefault = data.isDefault || false; // If true, this budget will be used as template for new months
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.totalIncome = data.totalIncome || null;
    this.budgetPercentageOfIncome = data.budgetPercentageOfIncome || null;
  }

  calculatePeriodStart() {
    const [year, month] = this.month.split('-').map(Number);
    return new Date(year, month - 1, 1).toISOString().split('T')[0];
  }

  calculatePeriodEnd() {
    const [year, month] = this.month.split('-').map(Number);
    return new Date(year, month, 0).toISOString().split('T')[0];
  }

  validate() {
    const errors = [];

    if (!this.month || !/^\d{4}-\d{2}$/.test(this.month)) {
      errors.push('El mes debe estar en formato YYYY-MM (ej: 2024-01)');
    }

    if (!this.year || this.year < 2020 || this.year > 2030) {
      errors.push('El año debe estar entre 2020 y 2030');
    }

    if (!['monthly', 'quarterly', 'semiannual', 'annual'].includes(this.period)) {
      errors.push('El período debe ser: monthly, quarterly, semiannual, o annual');
    }

    // Las fechas se calculan automáticamente, no son requeridas en la validación
    // if (!this.periodStart || !this.periodEnd) {
    //   errors.push('Debe especificar las fechas de inicio y fin del período');
    // }

    if (!['fixed', 'percentage'].includes(this.budgetType)) {
      errors.push('El tipo de presupuesto debe ser: fixed o percentage');
    }

    if (this.budgetType === 'percentage') {
      if (!this.percentage || this.percentage <= 0 || this.percentage > 100) {
        errors.push('El porcentaje debe estar entre 1 y 100 para presupuestos porcentuales');
      }
    }

    if (Array.isArray(this.categories) && this.categories.length === 0) {
      errors.push('Debe incluir al menos una categoría de presupuesto');
    }

    // Validate each category
    this.categories.forEach((category, index) => {
      console.log(`Validating category ${index + 1}:`, category);
      if (!category.category || category.category.trim() === '') {
        console.log(`Category ${index + 1} is invalid: empty or missing`);
        errors.push(`Categoría inválida en la posición ${index + 1}: debe tener un nombre`);
      } else {
        console.log(`Category ${index + 1} is valid: ${category.category}`);
      }
      // Para presupuestos porcentuales, el monto se calcula automáticamente
      if (this.budgetType === 'fixed' && (!category.budgeted || category.budgeted < 0)) {
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
      name: this.name,
      month: this.month,
      year: this.year,
      period: this.period,
      periodStart: this.periodStart,
      periodEnd: this.periodEnd,
      budgetType: this.budgetType,
      percentage: this.percentage,
      categories: this.categories,
      totalBudgeted: this.totalBudgeted,
      totalSpent: this.totalSpent,
      totalRemaining: this.totalRemaining,
      status: this.status,
      isDefault: this.isDefault,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      totalIncome: this.totalIncome,
      budgetPercentageOfIncome: this.budgetPercentageOfIncome
    };
  }

  static getBudgetCategories() {
    // Categorías globales por defecto (para compatibilidad)
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

  // Obtener categorías específicas de un presupuesto
  getBudgetSpecificCategories() {
    return this.categories.map(cat => ({
      value: cat.category,
      label: cat.category,
      budgeted: cat.budgeted,
      spent: cat.spent || 0,
      remaining: cat.remaining || 0
    }));
  }

  static getBudgetStatuses() {
    return [
      { value: 'draft', label: 'Borrador', color: 'default' },
      { value: 'active', label: 'Activo', color: 'primary' },
      { value: 'completed', label: 'Completado', color: 'success' }
    ];
  }

  static getBudgetPeriods() {
    return [
      { value: 'monthly', label: 'Mensual' },
      { value: 'quarterly', label: 'Trimestral' },
      { value: 'semiannual', label: 'Semestral' },
      { value: 'annual', label: 'Anual' }
    ];
  }

  static getBudgetTypes() {
    return [
      { value: 'fixed', label: 'Monto Fijo' },
      { value: 'percentage', label: 'Porcentual' }
    ];
  }

  static calculatePeriodDates(period, baseDate = new Date(), cutoffDay = 23) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth() + 1;
    const day = baseDate.getDate();
    
    let periodStart, periodEnd;
    
    // Determinar el período financiero basado en la fecha de corte
    let financialMonth, financialYear;
    
    if (day >= cutoffDay) {
      // Si estamos en o después del día de corte, el período actual es el mes siguiente
      financialMonth = month === 12 ? 1 : month + 1;
      financialYear = month === 12 ? year + 1 : year;
    } else {
      // Si estamos antes del día de corte, el período actual es este mes
      financialMonth = month;
      financialYear = year;
    }
    
    switch (period) {
      case 'monthly':
        // Período mensual: del día de corte del mes anterior al día anterior al día de corte del mes actual
        const startMonth = financialMonth === 1 ? 12 : financialMonth - 1;
        const startYear = financialMonth === 1 ? financialYear - 1 : financialYear;
        periodStart = new Date(startYear, startMonth - 1, cutoffDay);
        periodEnd = new Date(financialYear, financialMonth - 1, cutoffDay - 1);
        break;
      case 'quarterly':
        // Período trimestral: 3 meses financieros
        const quarterStartMonth = financialMonth;
        const quarterEndMonth = financialMonth + 2 > 12 ? financialMonth + 2 - 12 : financialMonth + 2;
        const quarterEndYear = financialMonth + 2 > 12 ? financialYear + 1 : financialYear;
        
        const qStartMonth = quarterStartMonth === 1 ? 12 : quarterStartMonth - 1;
        const qStartYear = quarterStartMonth === 1 ? financialYear - 1 : financialYear;
        periodStart = new Date(qStartYear, qStartMonth - 1, cutoffDay);
        periodEnd = new Date(quarterEndYear, quarterEndMonth - 1, cutoffDay - 1);
        break;
      case 'semiannual':
        // Período semestral: 6 meses financieros
        const semesterStartMonth = financialMonth;
        const semesterEndMonth = financialMonth + 5 > 12 ? financialMonth + 5 - 12 : financialMonth + 5;
        const semesterEndYear = financialMonth + 5 > 12 ? financialYear + 1 : financialYear;
        
        const sStartMonth = semesterStartMonth === 1 ? 12 : semesterStartMonth - 1;
        const sStartYear = semesterStartMonth === 1 ? financialYear - 1 : financialYear;
        periodStart = new Date(sStartYear, sStartMonth - 1, cutoffDay);
        periodEnd = new Date(semesterEndYear, semesterEndMonth - 1, cutoffDay - 1);
        break;
      case 'annual':
        // Período anual: 12 meses financieros
        const annualStartMonth = financialMonth === 1 ? 12 : financialMonth - 1;
        const annualStartYear = financialMonth === 1 ? financialYear - 1 : financialYear;
        periodStart = new Date(annualStartYear, annualStartMonth - 1, cutoffDay);
        periodEnd = new Date(financialYear, financialMonth - 1, cutoffDay - 1);
        break;
      default:
        throw new Error('Período no válido');
    }
    
    return {
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0]
    };
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
