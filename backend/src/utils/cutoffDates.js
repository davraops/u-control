/**
 * Utilidades para manejar fechas de corte personalizadas
 * El mes financiero va del día 23 al día 22 del mes siguiente
 */

class CutoffDateManager {
  constructor() {
    this.cutoffDay = 23; // Día de corte por defecto
  }

  /**
   * Obtiene el período financiero actual basado en la fecha de corte
   * @param {Date} date - Fecha de referencia (opcional, por defecto hoy)
   * @returns {Object} Objeto con información del período financiero
   */
  getCurrentFinancialPeriod(date = new Date()) {
    const currentDate = new Date(date);
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let financialMonth, financialYear, periodStart, periodEnd;

    if (currentDay >= this.cutoffDay) {
      // Si estamos en o después del día de corte, el período actual es el mes siguiente
      financialMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      financialYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    } else {
      // Si estamos antes del día de corte, el período actual es este mes
      financialMonth = currentMonth;
      financialYear = currentYear;
    }

    // Calcular fechas de inicio y fin del período
    // El período comienza el día de corte del mes anterior al período financiero
    const startMonth = financialMonth === 0 ? 11 : financialMonth - 1;
    const startYear = financialMonth === 0 ? financialYear - 1 : financialYear;
    periodStart = new Date(startYear, startMonth, this.cutoffDay);
    periodEnd = new Date(financialYear, financialMonth, this.cutoffDay - 1);

    return {
      financialMonth: financialMonth + 1, // Mes en formato 1-12
      financialYear: financialYear,
      periodStart: periodStart,
      periodEnd: periodEnd,
      periodString: `${financialYear}-${String(financialMonth + 1).padStart(2, '0')}`,
      displayString: `${String(financialMonth + 1).padStart(2, '0')}/${financialYear} (${this.cutoffDay}/${String(startMonth + 1).padStart(2, '0')} - ${String(this.cutoffDay - 1).padStart(2, '0')}/${String(financialMonth + 1).padStart(2, '0')})`
    };
  }

  /**
   * Obtiene el período financiero para un mes específico
   * @param {string} month - Mes en formato YYYY-MM
   * @returns {Object} Objeto con información del período financiero
   */
  getFinancialPeriodForMonth(month) {
    const [year, monthNum] = month.split('-').map(Number);
    
    // El período financiero es el mes especificado, pero las fechas van del día de corte del mes anterior
    // al día anterior al día de corte del mes actual
    const startMonth = monthNum === 1 ? 12 : monthNum - 1;
    const startYear = monthNum === 1 ? year - 1 : year;
    const periodStart = new Date(startYear, startMonth - 1, this.cutoffDay);
    const periodEnd = new Date(year, monthNum - 1, this.cutoffDay - 1);

    return {
      financialMonth: monthNum,
      financialYear: year,
      periodStart: periodStart,
      periodEnd: periodEnd,
      periodString: month,
      displayString: `${String(monthNum).padStart(2, '0')}/${year} (${this.cutoffDay}/${String(startMonth).padStart(2, '0')} - ${String(this.cutoffDay - 1).padStart(2, '0')}/${String(monthNum).padStart(2, '0')})`
    };
  }

  /**
   * Verifica si una fecha está dentro del período financiero
   * @param {Date} date - Fecha a verificar
   * @param {string} periodMonth - Mes del período en formato YYYY-MM
   * @returns {boolean} True si la fecha está en el período
   */
  isDateInFinancialPeriod(date, periodMonth) {
    const period = this.getFinancialPeriodForMonth(periodMonth);
    return date >= period.periodStart && date <= period.periodEnd;
  }

  /**
   * Obtiene todos los períodos financieros entre dos fechas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Array} Array de períodos financieros
   */
  getFinancialPeriodsBetween(startDate, endDate) {
    const periods = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const period = this.getCurrentFinancialPeriod(current);
      const periodKey = period.periodString;
      
      // Evitar duplicados
      if (!periods.find(p => p.periodString === periodKey)) {
        periods.push(period);
      }
      
      // Avanzar al siguiente mes
      current.setMonth(current.getMonth() + 1);
    }
    
    return periods;
  }

  /**
   * Configura el día de corte
   * @param {number} day - Día del mes (1-31)
   */
  setCutoffDay(day) {
    if (day < 1 || day > 31) {
      throw new Error('El día de corte debe estar entre 1 y 31');
    }
    this.cutoffDay = day;
  }

  /**
   * Obtiene el día de corte actual
   * @returns {number} Día de corte
   */
  getCutoffDay() {
    return this.cutoffDay;
  }
}

// Instancia singleton
const cutoffManager = new CutoffDateManager();

module.exports = {
  CutoffDateManager,
  cutoffManager
};
