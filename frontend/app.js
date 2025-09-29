// U-Control - Simple Frontend
// Configuration
const API_BASE_URL = 'http://localhost:3001/dev';

// Global state
let currentSection = 'dashboard';
let accounts = [];
let incomes = [];
let expenses = [];
let budgets = [];
let cutoffConfig = {
    cutoffDay: 23,
    isActive: true
};
let editingItem = null; // For edit operations

// Period management
let selectedPeriod = null; // null means current period
let availablePeriods = []; // Array of available periods

// Expense filtering
let filteredExpenses = []; // Filtered expenses for display
let selectedBudgetFilter = null; // Selected budget filter

// Initialize app
document.addEventListener('DOMContentLoaded', async function() {
    loadModals();
    await populatePeriodSelector();
    loadDashboard();
    showSection('dashboard');
    setupEventListeners();
});

// Load modals
async function loadModals() {
    try {
        const response = await fetch('modals.html');
        const modalsHTML = await response.text();
        document.getElementById('modals-container').innerHTML = modalsHTML;
    } catch (error) {
        console.error('Error loading modals:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Income recurring checkbox
    const incomeRecurringCheckbox = document.getElementById('incomeRecurring');
    if (incomeRecurringCheckbox) {
        incomeRecurringCheckbox.addEventListener('change', function() {
            const recurringPatternDiv = document.getElementById('recurringPatternDiv');
            if (recurringPatternDiv) {
                recurringPatternDiv.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
}

// Navigation functions
function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected section
    document.getElementById(section + '-section').style.display = 'block';
    currentSection = section;
    
    // Load section data
    switch(section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'accounts':
            loadAccounts();
            break;
        case 'incomes':
            loadIncomes();
            break;
        case 'expenses':
            loadExpenses();
            break;
        case 'budgets':
            loadBudgets();
            break;
        case 'settings':
            loadCutoffConfig();
            break;
    }
}

// API functions
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(API_BASE_URL + endpoint, options);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(`HTTP error! status: ${response.status}`);
            error.status = response.status;
            error.data = errorData;
            throw error;
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        if (error.status === 409) {
            // Re-throw 409 errors with the existing budget data
            throw error;
        }
        if (error.status === 400) {
            // Re-throw 400 errors to be handled by the calling function
            throw error;
        }
        showError('Error de conexión: ' + error.message);
        return null;
    }
}

// Dashboard functions
async function loadDashboard() {
    try {
        // Load all data in parallel
        const [accountsData, incomesData, expensesData, budgetsData] = await Promise.all([
            apiCall('/accounts'),
            apiCall('/incomes'),
            apiCall('/expenses'),
            apiCall('/budgets')
        ]);
        
        if (accountsData) accounts = accountsData.accounts || [];
        
        // Get the period to filter by (selected or current)
        const period = selectedPeriod || getCurrentFinancialPeriod();
        
        if (incomesData) {
            const allIncomes = incomesData.incomes || [];
            incomes = allIncomes.filter(income => 
                isDateInFinancialPeriod(income.date, period)
            );
        }
        
        if (expensesData) {
            const allExpenses = expensesData.expenses || [];
            expenses = allExpenses.filter(expense => 
                isDateInFinancialPeriod(expense.date, period)
            );
        }
        
        if (budgetsData) budgets = budgetsData.budgets || [];
        
        updateDashboard();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Error al cargar el dashboard');
    }
}

async function updateDashboard() {
    // Calculate totals for selected period
    const totalIncomes = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    // Calculate global balance (all time)
    let globalBalance = 0;
    try {
        const [allIncomesData, allExpensesData] = await Promise.all([
            apiCall('/incomes'),
            apiCall('/expenses')
        ]);
        
        if (allIncomesData) {
            const allIncomes = allIncomesData.incomes || [];
            const globalIncomes = allIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
            globalBalance += globalIncomes;
        }
        
        if (allExpensesData) {
            const allExpenses = allExpensesData.expenses || [];
            const globalExpenses = allExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
            globalBalance -= globalExpenses;
        }
    } catch (error) {
        console.error('Error calculating global balance:', error);
        globalBalance = totalIncomes - totalExpenses; // Fallback to period balance
    }
    
    // Get period info
    const period = selectedPeriod || getCurrentFinancialPeriod();
    
    // Update cards
    document.getElementById('total-incomes').textContent = formatCurrency(totalIncomes);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('balance').textContent = formatCurrency(globalBalance);
    document.getElementById('total-accounts').textContent = accounts.length;
    
    // Add period info to dashboard
    const periodInfo = document.getElementById('period-info');
    if (periodInfo) {
        const isCurrentPeriod = !selectedPeriod;
        periodInfo.innerHTML = `
            <div class="alert ${isCurrentPeriod ? 'alert-info' : 'alert-warning'}">
                <i class="fas fa-calendar-alt me-2"></i>
                <strong>Período ${isCurrentPeriod ? 'actual' : 'seleccionado'}:</strong> ${period.displayString}
                <span class="badge bg-primary ms-2">${incomes.length} ingresos</span>
                <span class="badge bg-warning text-dark ms-1">${expenses.length} gastos</span>
                ${!isCurrentPeriod ? '<span class="badge bg-secondary ms-1">Balance: Global</span>' : ''}
            </div>
        `;
    }
    
    // Update recent items
    updateRecentIncomes();
    updateRecentExpenses();
}

function updateRecentIncomes() {
    const container = document.getElementById('recent-incomes');
    const recentIncomes = incomes.slice(0, 5);
    
    if (recentIncomes.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay ingresos registrados</p>';
        return;
    }
    
    container.innerHTML = recentIncomes.map(income => `
        <div class="list-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="list-item-title">${income.description}</h6>
                    <small class="text-muted">${income.date} • ${income.category}</small>
                </div>
                <span class="list-item-amount amount-positive">${formatCurrency(income.amount)}</span>
            </div>
        </div>
    `).join('');
}

function updateRecentExpenses() {
    const container = document.getElementById('recent-expenses');
    const recentExpenses = expenses.slice(0, 5);
    
    if (recentExpenses.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay gastos registrados</p>';
        return;
    }
    
    container.innerHTML = recentExpenses.map(expense => `
        <div class="list-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="list-item-title">${expense.description}</h6>
                    <small class="text-muted">${expense.date} • ${expense.category}</small>
                </div>
                <span class="list-item-amount amount-negative">${formatCurrency(expense.amount)}</span>
            </div>
        </div>
    `).join('');
}

// Accounts functions
async function loadAccounts() {
    const data = await apiCall('/accounts');
    if (data) {
        accounts = data.accounts || [];
        updateAccountsList();
    }
}

function updateAccountsList() {
    const container = document.getElementById('accounts-list');
    
    if (accounts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-credit-card"></i>
                <h5>No hay cuentas registradas</h5>
                <p>Agrega tu primera cuenta para comenzar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = accounts.map(account => `
        <div class="list-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="list-item-title">${account.name}</h6>
                    <small class="text-muted">${account.type} • ${account.bank || 'Efectivo'}</small>
                </div>
                <div class="d-flex align-items-center">
                    <div class="text-end me-3">
                        <div class="list-item-amount amount-neutral">${formatCurrency(account.balance)}</div>
                        <small class="text-muted">${account.currency}</small>
                    </div>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editAccount('${account.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount('${account.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Incomes functions
async function loadIncomes() {
    const data = await apiCall('/incomes');
    if (data) {
        const allIncomes = data.incomes || [];
        
        // Filtrar ingresos por el período seleccionado o actual
        const period = selectedPeriod || getCurrentFinancialPeriod();
        incomes = allIncomes.filter(income => 
            isDateInFinancialPeriod(income.date, period)
        );
        
        updateIncomesList();
    }
}

function updateIncomesList() {
    const container = document.getElementById('incomes-list');
    const period = selectedPeriod || getCurrentFinancialPeriod();
    
    if (incomes.length === 0) {
        const isCurrentPeriod = !selectedPeriod;
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-arrow-up"></i>
                <h5>No hay ingresos en el período ${isCurrentPeriod ? 'actual' : 'seleccionado'}</h5>
                <p>Período: ${period.displayString}</p>
                <p>Agrega tu primer ingreso para comenzar</p>
            </div>
        `;
        return;
    }
    
    // Agregar información del período al inicio de la lista
    const isCurrentPeriod = !selectedPeriod;
    const periodInfo = `
        <div class="alert ${isCurrentPeriod ? 'alert-info' : 'alert-warning'} mb-3">
            <i class="fas fa-calendar-alt me-2"></i>
            <strong>Período ${isCurrentPeriod ? 'actual' : 'seleccionado'}:</strong> ${period.displayString}
            <span class="badge bg-primary ms-2">${incomes.length} ingreso${incomes.length !== 1 ? 's' : ''}</span>
        </div>
    `;
    
    container.innerHTML = periodInfo + incomes.map(income => `
        <div class="list-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="list-item-title">${income.description}</h6>
                    <small class="text-muted">${income.date} • ${income.category}</small>
                </div>
                <div class="d-flex align-items-center">
                    <div class="text-end me-3">
                        <div class="list-item-amount amount-positive">${formatCurrency(income.amount)}</div>
                        <small class="text-muted">${income.currency}</small>
                    </div>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editIncome('${income.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteIncome('${income.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Expenses functions
async function loadExpenses() {
    const data = await apiCall('/expenses');
    if (data) {
        const allExpenses = data.expenses || [];
        
        // Filtrar gastos por el período seleccionado o actual
        const period = selectedPeriod || getCurrentFinancialPeriod();
        expenses = allExpenses.filter(expense => 
            isDateInFinancialPeriod(expense.date, period)
        );
        
        // Load budgets if not already loaded
        if (budgets.length === 0) {
            await loadBudgets();
        }
        
        // Load accounts if not already loaded
        if (accounts.length === 0) {
            await loadAccounts();
        }
        
        // Apply budget filter if selected
        applyBudgetFilter();
        
        // Populate budget filter dropdown
        populateBudgetFilter();
        
        updateExpensesList();
    }
}

function updateExpensesList() {
    const container = document.getElementById('expenses-list');
    const period = selectedPeriod || getCurrentFinancialPeriod();
    
    // Use filtered expenses for display
    const expensesToShow = filteredExpenses.length > 0 ? filteredExpenses : expenses;
    
    if (expensesToShow.length === 0) {
        const isCurrentPeriod = !selectedPeriod;
        const filterMessage = selectedBudgetFilter ? 
            ` con el presupuesto seleccionado` : 
            ` en el período ${isCurrentPeriod ? 'actual' : 'seleccionado'}`;
        
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-arrow-down"></i>
                <h5>No hay gastos${filterMessage}</h5>
                <p>Período: ${period.displayString}</p>
                ${selectedBudgetFilter ? `<p>Presupuesto: ${selectedBudgetFilter}</p>` : ''}
                <p>Agrega tu primer gasto para comenzar</p>
            </div>
        `;
        return;
    }
    
    // Agregar información del período al inicio de la lista
    const isCurrentPeriod = !selectedPeriod;
    const periodInfo = `
        <div class="alert ${isCurrentPeriod ? 'alert-warning' : 'alert-secondary'} mb-3">
            <i class="fas fa-calendar-alt me-2"></i>
            <strong>Período ${isCurrentPeriod ? 'actual' : 'seleccionado'}:</strong> ${period.displayString}
            <span class="badge bg-warning text-dark ms-2">${expensesToShow.length} gasto${expensesToShow.length !== 1 ? 's' : ''}</span>
            ${selectedBudgetFilter ? `<span class="badge bg-info ms-1">Filtrado por presupuesto</span>` : ''}
        </div>
    `;
    
           container.innerHTML = periodInfo + expensesToShow.map(expense => {
               // Find budget information
               const budget = budgets.find(b => b.id === expense.budgetId);
               const isUnbudgeted = !expense.budgetId;
               const budgetInfo = budget ? `${budget.month}/${budget.year}` : 'Sin presupuesto';
               const budgetBadge = isUnbudgeted ? 
                   '<span class="badge bg-danger"><i class="fas fa-exclamation-triangle me-1"></i>Sin presupuesto</span>' :
                   `<span class="badge bg-info">Presupuesto: ${budgetInfo}</span>`;
               
               // Add warning class for unbudgeted expenses
               const itemClass = isUnbudgeted ? 'list-item list-item-warning' : 'list-item';
               
               return `
               <div class="${itemClass}">
                   <div class="d-flex justify-content-between align-items-center">
                       <div>
                           <h6 class="list-item-title">
                               ${isUnbudgeted ? '<i class="fas fa-exclamation-triangle text-danger me-2"></i>' : ''}
                               ${expense.description}
                           </h6>
                           <small class="text-muted">${expense.date} • ${expense.category}</small>
                           <div class="mt-1">
                               ${budgetBadge}
                               ${isUnbudgeted ? '<small class="text-danger ms-2"><i class="fas fa-info-circle"></i> Gasto no controlado</small>' : ''}
                           </div>
                       </div>
                       <div class="d-flex align-items-center">
                           <div class="text-end me-3">
                               <div class="list-item-amount ${isUnbudgeted ? 'amount-danger' : 'amount-negative'}">${formatCurrency(expense.amount)}</div>
                               <small class="text-muted">${expense.currency}</small>
                           </div>
                           <div class="btn-group" role="group">
                               <button class="btn btn-sm btn-outline-primary" onclick="editExpense('${expense.id}')" title="Editar">
                                   <i class="fas fa-edit"></i>
                               </button>
                               <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense('${expense.id}')" title="Eliminar">
                                   <i class="fas fa-trash"></i>
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
               `;
           }).join('');
}

// Budget filtering functions
function populateBudgetFilter() {
    const filter = document.getElementById('expenseBudgetFilter');
    if (!filter) return;
    
    // Get unique budgets from current expenses
    const budgetIds = [...new Set(expenses.map(expense => expense.budgetId).filter(id => id))];
    const uniqueBudgets = budgetIds.map(id => budgets.find(b => b.id === id)).filter(b => b);
    
    filter.innerHTML = '<option value="">Todos los presupuestos</option>';
    
    // Add unbudgeted option if there are unbudgeted expenses
    const hasUnbudgeted = expenses.some(expense => !expense.budgetId);
    if (hasUnbudgeted) {
        const unbudgetedOption = document.createElement('option');
        unbudgetedOption.value = 'unbudgeted';
        unbudgetedOption.textContent = '⚠️ Sin presupuesto';
        unbudgetedOption.style.color = '#dc3545';
        filter.appendChild(unbudgetedOption);
    }
    
    uniqueBudgets.forEach(budget => {
        const option = document.createElement('option');
        option.value = budget.id;
        option.textContent = `${budget.month}/${budget.year} - ${budget.categories.length} categorías`;
        if (selectedBudgetFilter && budget.id === selectedBudgetFilter) {
            option.selected = true;
        }
        filter.appendChild(option);
    });
}

// Function to populate budget selector in expense modal
function populateExpenseBudgetSelector() {
    const selector = document.getElementById('expenseBudget');
    if (!selector) return;
    
    // Clear existing options except the first two
    selector.innerHTML = '<option value="">Seleccionar presupuesto</option><option value="unbudgeted">⚠️ Sin presupuesto (No recomendado)</option>';
    
    // Add all available budgets
    budgets.forEach(budget => {
        const option = document.createElement('option');
        option.value = budget.id;
        option.textContent = `${budget.name || budget.month} ${budget.year} - ${budget.categories.length} categorías`;
        selector.appendChild(option);
    });
    
    console.log(`Poblado selector de presupuestos con ${budgets.length} presupuestos`);
}

function applyBudgetFilter() {
    if (!selectedBudgetFilter) {
        filteredExpenses = [];
        return;
    }
    
    if (selectedBudgetFilter === 'unbudgeted') {
        filteredExpenses = expenses.filter(expense => !expense.budgetId);
    } else {
        filteredExpenses = expenses.filter(expense => expense.budgetId === selectedBudgetFilter);
    }
}

function filterExpensesByBudget() {
    const filter = document.getElementById('expenseBudgetFilter');
    if (!filter) return;
    
    selectedBudgetFilter = filter.value || null;
    applyBudgetFilter();
    updateExpensesList();
}

// Budgets functions
async function loadBudgets() {
    const data = await apiCall('/budgets');
    if (data) {
        budgets = data.budgets || [];
        console.log(`Cargados ${budgets.length} presupuestos:`, budgets.map(b => ({ id: b.id, name: b.name, month: b.month, year: b.year })));
        updateBudgetsList();
    }
}

function updateBudgetsList() {
    const container = document.getElementById('budgets-list');
    
    if (budgets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-pie"></i>
                <h5>No hay presupuestos registrados</h5>
                <p>Agrega tu primer presupuesto para comenzar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = budgets.map(budget => {
        // Calcular porcentaje de ganancias localmente
        const totalIncome = 3700000; // Simulamos ingresos del mes
        const budgetPercentageOfIncome = Math.round((budget.totalBudgeted / totalIncome) * 100);
        
        // Usar las fechas que vienen del backend si están disponibles
        let periodStart, periodEnd;
        
        if (budget.periodStart && budget.periodEnd) {
            // Usar fechas del backend
            const startDate = new Date(budget.periodStart);
            const endDate = new Date(budget.periodEnd);
            periodStart = `${startDate.getDate()}/${String(startDate.getMonth() + 1).padStart(2, '0')}/${startDate.getFullYear()}`;
            periodEnd = `${endDate.getDate()}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${endDate.getFullYear()}`;
        } else {
            // Fallback: calcular fechas usando la configuración local
            const cutoffDay = cutoffConfig.cutoffDay;
            const [year, month] = budget.month.split('-').map(Number);
            
            // El período financiero es el mes especificado, pero las fechas van del día de corte del mes anterior
            // al día anterior al día de corte del mes actual
            const startMonth = month === 1 ? 12 : month - 1;
            const startYear = month === 1 ? year - 1 : year;
            periodStart = `${cutoffDay}/${String(startMonth).padStart(2, '0')}/${startYear}`;
            periodEnd = `${cutoffDay - 1}/${String(month).padStart(2, '0')}/${year}`;
        }
        
        const periodLabel = getPeriodLabel(budget.period || 'monthly');
        const budgetTypeLabel = budget.budgetType === 'percentage' ? 'Porcentual' : 'Monto Fijo';
        const budgetTypeBadge = budget.budgetType === 'percentage' ? 'bg-warning' : 'bg-primary';
        
        // Información adicional para presupuestos porcentuales
        const percentageInfo = budget.budgetType === 'percentage' ? 
            `<div class="mt-1">
                <small class="text-info">
                    <i class="fas fa-calculator"></i> 
                    ${budget.percentage}% de $${formatCurrency(budget.totalIncome || 0)} = $${formatCurrency(budget.totalBudgeted || 0)}
                </small>
            </div>` : '';
        
        const budgetName = budget.name || `Presupuesto ${budget.month}/${budget.year}`;
        const categoryNames = budget.categories.map(cat => cat.category).join(', ');
        
        return `
        <div class="list-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="list-item-title">${budgetName}</h6>
                    <small class="text-muted">${budget.categories.length} categorías • Estado: ${budget.status} • ${periodLabel}</small>
                    <div class="mt-1">
                        <span class="badge ${budgetTypeBadge}">${budgetTypeLabel}</span>
                        ${budget.budgetType === 'percentage' ? `<span class="badge bg-info ms-1">${budget.percentage}% de ingresos</span>` : ''}
                        <span class="badge bg-success ms-1">${budgetPercentageOfIncome}% de las ganancias</span>
                    </div>
                    <div class="mt-1">
                        <small class="text-info">
                            <i class="fas fa-tags"></i> Categorías: ${categoryNames}
                        </small>
                    </div>
                    ${percentageInfo}
                    <div class="mt-1">
                        <small class="text-success">
                            <i class="fas fa-calendar-alt"></i> Período: ${periodStart} - ${periodEnd}
                        </small>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <div class="text-end me-3">
                        <div class="list-item-amount amount-neutral">${formatCurrency(budget.totalBudgeted)}</div>
                        <small class="text-muted">
                            ${budget.budgetType === 'percentage' ? 'Calculado automáticamente' : 'Total presupuestado'}
                        </small>
                    </div>
                    <div class="btn-group" role="group">
                        ${budget.status === 'draft' ? 
                            `<button class="btn btn-sm btn-success" onclick="activateBudget('${budget.id}')" title="Activar presupuesto">
                                <i class="fas fa-play"></i>
                            </button>` : 
                            `<button class="btn btn-sm btn-warning" onclick="deactivateBudget('${budget.id}')" title="Desactivar presupuesto">
                                <i class="fas fa-pause"></i>
                            </button>`
                        }
                        <button class="btn btn-sm btn-outline-primary" onclick="editBudget('${budget.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBudget('${budget.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Utility functions for financial periods
function getCurrentFinancialPeriod() {
    const cutoffDay = cutoffConfig.cutoffDay;
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    let financialMonth, financialYear, periodStart, periodEnd;
    
    if (currentDay >= cutoffDay) {
        // Si estamos en o después del día de corte, el período actual es el mes siguiente
        financialMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        financialYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    } else {
        // Si estamos antes del día de corte, el período actual es este mes
        financialMonth = currentMonth;
        financialYear = currentYear;
    }
    
    // Calcular fechas de inicio y fin del período
    const startMonth = financialMonth === 1 ? 12 : financialMonth - 1;
    const startYear = financialMonth === 1 ? financialYear - 1 : financialYear;
    periodStart = new Date(startYear, startMonth - 1, cutoffDay);
    periodEnd = new Date(financialYear, financialMonth - 1, cutoffDay - 1);
    
    return {
        financialMonth,
        financialYear,
        periodStart,
        periodEnd,
        periodString: `${financialYear}-${String(financialMonth).padStart(2, '0')}`,
        displayString: `${String(financialMonth).padStart(2, '0')}/${financialYear} (${cutoffDay}/${String(startMonth).padStart(2, '0')} - ${cutoffDay - 1}/${String(financialMonth).padStart(2, '0')})`
    };
}

function isDateInFinancialPeriod(date, period) {
    const incomeDate = new Date(date);
    return incomeDate >= period.periodStart && incomeDate <= period.periodEnd;
}

// Period management functions
async function generateAvailablePeriods() {
    try {
        // Get all unique periods from incomes and expenses
        const [incomesData, expensesData] = await Promise.all([
            apiCall('/incomes'),
            apiCall('/expenses')
        ]);
        
        const periods = new Set();
        
        // Extract periods from incomes
        if (incomesData && incomesData.incomes) {
            incomesData.incomes.forEach(income => {
                const period = getFinancialPeriodForDate(new Date(income.date));
                periods.add(period.periodString);
            });
        }
        
        // Extract periods from expenses
        if (expensesData && expensesData.expenses) {
            expensesData.expenses.forEach(expense => {
                const period = getFinancialPeriodForDate(new Date(expense.date));
                periods.add(period.periodString);
            });
        }
        
        // Convert set to array and create period objects
        const periodObjects = Array.from(periods).map(periodString => {
            const [year, month] = periodString.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return getFinancialPeriodForDate(date);
        });
        
        // Sort by date (most recent first)
        return periodObjects.sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart));
        
    } catch (error) {
        console.error('Error generating available periods:', error);
        // Fallback to current period only
        return [getCurrentFinancialPeriod()];
    }
}

function getFinancialPeriodForDate(date) {
    const cutoffDay = cutoffConfig.cutoffDay;
    const currentDay = date.getDate();
    const currentMonth = date.getMonth() + 1;
    const currentYear = date.getFullYear();
    
    let financialMonth, financialYear, periodStart, periodEnd;
    
    if (currentDay >= cutoffDay) {
        // Si estamos en o después del día de corte, el período actual es el mes siguiente
        financialMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        financialYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    } else {
        // Si estamos antes del día de corte, el período actual es este mes
        financialMonth = currentMonth;
        financialYear = currentYear;
    }
    
    // Calcular fechas de inicio y fin del período
    const startMonth = financialMonth === 1 ? 12 : financialMonth - 1;
    const startYear = financialMonth === 1 ? financialYear - 1 : financialYear;
    periodStart = new Date(startYear, startMonth - 1, cutoffDay);
    periodEnd = new Date(financialYear, financialMonth - 1, cutoffDay - 1);
    
    return {
        financialMonth,
        financialYear,
        periodStart,
        periodEnd,
        periodString: `${financialYear}-${String(financialMonth).padStart(2, '0')}`,
        displayString: `${String(financialMonth).padStart(2, '0')}/${financialYear} (${cutoffDay}/${String(startMonth).padStart(2, '0')} - ${cutoffDay - 1}/${String(financialMonth).padStart(2, '0')})`
    };
}

async function populatePeriodSelector() {
    const selectors = [
        document.getElementById('period-selector'),
        document.getElementById('incomes-period-selector'),
        document.getElementById('expenses-period-selector')
    ];
    
    try {
        availablePeriods = await generateAvailablePeriods();
        const currentPeriod = getCurrentFinancialPeriod();
        
        selectors.forEach(selector => {
            if (!selector) return;
            
            selector.innerHTML = availablePeriods.map(period => {
                const isCurrent = period.periodString === currentPeriod.periodString;
                const isSelected = selectedPeriod ? period.periodString === selectedPeriod.periodString : isCurrent;
                return `<option value="${period.periodString}" ${isSelected ? 'selected' : ''} ${isCurrent ? 'data-current="true"' : ''}>${period.displayString}${isCurrent ? ' (Actual)' : ''}</option>`;
            }).join('');
        });
    } catch (error) {
        console.error('Error populating period selector:', error);
        // Fallback to current period only
        const currentPeriod = getCurrentFinancialPeriod();
        availablePeriods = [currentPeriod];
        
        selectors.forEach(selector => {
            if (!selector) return;
            selector.innerHTML = `<option value="${currentPeriod.periodString}" selected data-current="true">${currentPeriod.displayString} (Actual)</option>`;
        });
    }
}

function changePeriod() {
    // Get the value from any of the selectors (they should all be in sync)
    const selector = document.getElementById('period-selector') || 
                   document.getElementById('incomes-period-selector') || 
                   document.getElementById('expenses-period-selector');
    if (!selector) return;
    
    const selectedValue = selector.value;
    if (selectedValue === 'current') {
        selectedPeriod = null;
    } else {
        selectedPeriod = availablePeriods.find(p => p.periodString === selectedValue);
    }
    
    // Sync all selectors to the same value
    const allSelectors = [
        document.getElementById('period-selector'),
        document.getElementById('incomes-period-selector'),
        document.getElementById('expenses-period-selector')
    ];
    
    allSelectors.forEach(sel => {
        if (sel && sel.value !== selectedValue) {
            sel.value = selectedValue;
        }
    });
    
    // Reload current section with new period
    switch(currentSection) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'incomes':
            loadIncomes();
            break;
        case 'expenses':
            loadExpenses();
            break;
        case 'budgets':
            loadBudgets();
            break;
    }
}

function goToPreviousPeriod() {
    const selector = document.getElementById('period-selector') || 
                   document.getElementById('incomes-period-selector') || 
                   document.getElementById('expenses-period-selector');
    if (!selector) return;
    
    const currentIndex = selector.selectedIndex;
    if (currentIndex < selector.options.length - 1) {
        // Update all selectors
        const allSelectors = [
            document.getElementById('period-selector'),
            document.getElementById('incomes-period-selector'),
            document.getElementById('expenses-period-selector')
        ];
        
        allSelectors.forEach(sel => {
            if (sel) {
                sel.selectedIndex = currentIndex + 1;
            }
        });
        
        changePeriod();
    }
}

function goToNextPeriod() {
    const selector = document.getElementById('period-selector') || 
                   document.getElementById('incomes-period-selector') || 
                   document.getElementById('expenses-period-selector');
    if (!selector) return;
    
    const currentIndex = selector.selectedIndex;
    if (currentIndex > 0) {
        // Update all selectors
        const allSelectors = [
            document.getElementById('period-selector'),
            document.getElementById('incomes-period-selector'),
            document.getElementById('expenses-period-selector')
        ];
        
        allSelectors.forEach(sel => {
            if (sel) {
                sel.selectedIndex = currentIndex - 1;
            }
        });
        
        changePeriod();
    }
}

function goToCurrentPeriod() {
    const selector = document.getElementById('period-selector') || 
                   document.getElementById('incomes-period-selector') || 
                   document.getElementById('expenses-period-selector');
    if (!selector) return;
    
    // Find current period option
    const currentOption = Array.from(selector.options).find(option => option.dataset.current === 'true');
    if (currentOption) {
        // Update all selectors
        const allSelectors = [
            document.getElementById('period-selector'),
            document.getElementById('incomes-period-selector'),
            document.getElementById('expenses-period-selector')
        ];
        
        allSelectors.forEach(sel => {
            if (sel) {
                sel.value = currentOption.value;
            }
        });
        
        selectedPeriod = null;
        changePeriod();
    }
}

// Settings functions
async function loadCutoffConfig() {
    try {
        // Por ahora usamos configuración local hasta que la API esté funcionando
        document.getElementById('cutoffDay').value = cutoffConfig.cutoffDay;
        updateCurrentPeriodDisplay();
        
        // TODO: Implementar llamada a la API cuando esté disponible
        // const data = await apiCall('/cutoff-config');
        // if (data && data.config) {
        //     cutoffConfig = data.config;
        //     document.getElementById('cutoffDay').value = cutoffConfig.cutoffDay;
        //     updateCurrentPeriodDisplay();
        // }
    } catch (error) {
        console.error('Error loading cutoff config:', error);
        showError('Error al cargar la configuración de fechas de corte');
    }
}

function updateCurrentPeriodDisplay() {
    const cutoffDay = cutoffConfig.cutoffDay;
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    let financialMonth, financialYear, periodStart, periodEnd;
    
    if (currentDay >= cutoffDay) {
        // Si estamos en o después del día de corte, el período actual es el mes siguiente
        financialMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        financialYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    } else {
        // Si estamos antes del día de corte, el período actual es este mes
        financialMonth = currentMonth;
        financialYear = currentYear;
    }
    
    // Calcular fechas de inicio y fin del período
    // El período comienza el día de corte del mes anterior al período financiero
    const startMonth = financialMonth === 1 ? 12 : financialMonth - 1;
    const startYear = financialMonth === 1 ? financialYear - 1 : financialYear;
    periodStart = `${cutoffDay}/${String(startMonth).padStart(2, '0')}`;
    periodEnd = `${cutoffDay - 1}/${String(financialMonth).padStart(2, '0')}`;
    
    const periodDisplay = `${String(financialMonth).padStart(2, '0')}/${financialYear} (${periodStart} - ${periodEnd})`;
    document.getElementById('currentPeriodDisplay').textContent = periodDisplay;
}

async function updateCutoffConfig() {
    const newCutoffDay = parseInt(document.getElementById('cutoffDay').value);
    
    if (newCutoffDay < 1 || newCutoffDay > 31) {
        showError('El día de corte debe estar entre 1 y 31');
        return;
    }
    
    try {
        // Actualizar configuración local
        cutoffConfig.cutoffDay = newCutoffDay;
        updateCurrentPeriodDisplay();
        showSuccess('Configuración de fechas de corte actualizada exitosamente');
        
        // Recargar presupuestos para mostrar las nuevas fechas
        loadBudgets();
        
        // TODO: Implementar llamada a la API cuando esté disponible
        // const result = await apiCall('/cutoff-config', 'PUT', {
        //     cutoffDay: newCutoffDay,
        //     isActive: true
        // });
    } catch (error) {
        console.error('Error updating cutoff config:', error);
        showError('Error al actualizar la configuración de fechas de corte');
    }
}

// Modal functions
function showAddAccountModal() {
    editingItem = null;
    document.getElementById('accountModalTitle').textContent = 'Agregar Cuenta';
    document.getElementById('accountForm').reset();
    document.getElementById('accountBank').required = false;
    document.getElementById('accountNumber').required = false;
    new bootstrap.Modal(document.getElementById('accountModal')).show();
}

function showAddIncomeModal() {
    editingItem = null;
    document.getElementById('incomeModalTitle').textContent = 'Agregar Ingreso';
    document.getElementById('incomeForm').reset();
    document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
    populateAccountSelect('incomeAccount');
    new bootstrap.Modal(document.getElementById('incomeModal')).show();
}

function showAddExpenseModal() {
    // Check if there are active budgets
    const activeBudgets = budgets.filter(budget => 
        budget.isActive && budget.status === 'active'
    );
    
    if (activeBudgets.length === 0) {
        showError('No hay presupuestos activos. Debes crear un presupuesto antes de agregar gastos.');
        return;
    }
    
    editingItem = null;
    document.getElementById('expenseModalTitle').textContent = 'Agregar Gasto';
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    populateAccountSelect('expenseAccount');
    populateBudgetSelect('expenseBudget');
    new bootstrap.Modal(document.getElementById('expenseModal')).show();
}

function showAddBudgetModal() {
    editingItem = null;
    document.getElementById('budgetModalTitle').textContent = 'Agregar Presupuesto';
    document.getElementById('budgetForm').reset();
    document.getElementById('budgetPeriod').value = 'monthly';
    document.getElementById('budgetType').value = 'fixed';
    
    // Initialize with one empty category
    loadBudgetCategories([]);
    
    // Configurar inputs según el tipo seleccionado
    toggleBudgetInputs();
    
    // Calcular fechas automáticamente al abrir el modal
    updateBudgetPeriodDates();
    
    new bootstrap.Modal(document.getElementById('budgetModal')).show();
}

// Populate account select
function populateAccountSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar cuenta</option>';
    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = `${account.name} (${account.type})`;
        select.appendChild(option);
    });
}

// Save functions
async function saveAccount() {
    const form = document.getElementById('accountForm');
    const formData = new FormData(form);
    
    const accountData = {
        name: document.getElementById('accountName').value,
        type: document.getElementById('accountType').value,
        bank: document.getElementById('accountBank').value,
        accountNumber: document.getElementById('accountNumber').value,
        balance: parseFloat(document.getElementById('accountBalance').value) || 0,
        currency: document.getElementById('accountCurrency').value
    };
    
    // Validation
    if (!accountData.name || !accountData.type || !accountData.currency) {
        showError('Por favor completa todos los campos requeridos');
        return;
    }
    
    try {
        let result;
        if (editingItem) {
            result = await apiCall(`/accounts/${editingItem.id}`, 'PUT', accountData);
        } else {
            result = await apiCall('/accounts', 'POST', accountData);
        }
        
        if (result) {
            showSuccess(editingItem ? 'Cuenta actualizada exitosamente' : 'Cuenta creada exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('accountModal')).hide();
            loadAccounts();
            loadDashboard(); // Refresh dashboard
        }
    } catch (error) {
        showError('Error al guardar la cuenta: ' + error.message);
    }
}

async function saveIncome() {
    const incomeData = {
        description: document.getElementById('incomeDescription').value,
        amount: parseFloat(document.getElementById('incomeAmount').value) || 0,
        category: document.getElementById('incomeCategory').value,
        date: document.getElementById('incomeDate').value,
        accountId: document.getElementById('incomeAccount').value,
        currency: document.getElementById('incomeCurrency').value,
        isRecurring: document.getElementById('incomeRecurring').checked,
        recurringPattern: document.getElementById('incomeRecurringPattern').value
    };
    
    // Validation
    if (!incomeData.description || !incomeData.amount || !incomeData.category || !incomeData.date || !incomeData.accountId) {
        showError('Por favor completa todos los campos requeridos');
        return;
    }
    
    try {
        let result;
        if (editingItem) {
            result = await apiCall(`/incomes/${editingItem.id}`, 'PUT', incomeData);
        } else {
            result = await apiCall('/incomes', 'POST', incomeData);
        }
        
        if (result) {
            showSuccess(editingItem ? 'Ingreso actualizado exitosamente' : 'Ingreso creado exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('incomeModal')).hide();
            loadIncomes();
            loadDashboard(); // Refresh dashboard
            
            // Recalcular presupuestos porcentuales si es un nuevo ingreso
            if (!editingItem) {
                await recalculatePercentageBudgets();
            }
        }
    } catch (error) {
        showError('Error al guardar el ingreso: ' + error.message);
    }
}

// Función para recalcular presupuestos porcentuales
async function recalculatePercentageBudgets() {
    try {
        // Obtener todos los presupuestos
        const budgetsData = await apiCall('/budgets');
        if (budgetsData && budgetsData.budgets) {
            // Filtrar presupuestos porcentuales activos
            const percentageBudgets = budgetsData.budgets.filter(budget => 
                budget.budgetType === 'percentage' && budget.isActive && budget.status === 'active'
            );
            
            if (percentageBudgets.length > 0) {
                console.log(`Recalculando ${percentageBudgets.length} presupuestos porcentuales...`);
                // Recargar la lista de presupuestos para mostrar los nuevos cálculos
                loadBudgets();
            }
        }
    } catch (error) {
        console.error('Error recalculating percentage budgets:', error);
    }
}

async function saveExpense() {
    const expenseData = {
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value) || 0,
        category: document.getElementById('expenseCategory').value,
        date: document.getElementById('expenseDate').value,
        accountId: document.getElementById('expenseAccount').value,
        budgetId: document.getElementById('expenseBudget').value,
        currency: document.getElementById('expenseCurrency').value
    };
    
    // Validation
    if (!expenseData.description || !expenseData.amount || !expenseData.category || !expenseData.date || !expenseData.accountId) {
        showError('Por favor completa todos los campos requeridos');
        return;
    }
    
    // Handle unbudgeted expenses
    if (expenseData.budgetId === 'unbudgeted') {
        const confirmed = confirm(
            '⚠️ ADVERTENCIA: Estás registrando un gasto SIN presupuesto.\n\n' +
            'Esto puede descontrolar tus finanzas y hacer que gastes más de lo planeado.\n\n' +
            '¿Estás seguro de que quieres continuar?\n\n' +
            'Recomendación: Crea un presupuesto antes de registrar este gasto.'
        );
        
        if (!confirmed) {
            return; // User cancelled
        }
        
        // Set budgetId to null for unbudgeted expenses
        expenseData.budgetId = null;
    } else if (expenseData.budgetId) {
        // Validate budget exists and is active
        const selectedBudget = budgets.find(budget => budget.id === expenseData.budgetId);
        if (!selectedBudget || !selectedBudget.isActive || selectedBudget.status !== 'active') {
            showError('El presupuesto seleccionado no está disponible o no está activo');
            return;
        }
    } else {
        showError('Por favor selecciona un presupuesto o marca como "Sin presupuesto"');
        return;
    }
    
    try {
        let result;
        if (editingItem) {
            result = await apiCall(`/expenses/${editingItem.id}`, 'PUT', expenseData);
        } else {
            result = await apiCall('/expenses', 'POST', expenseData);
        }
        
        if (result) {
            showSuccess(editingItem ? 'Gasto actualizado exitosamente' : 'Gasto creado exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('expenseModal')).hide();
            loadExpenses();
            loadDashboard(); // Refresh dashboard
        }
    } catch (error) {
        showError('Error al guardar el gasto: ' + error.message);
    }
}

async function saveBudget() {
    const period = document.getElementById('budgetPeriod').value;
    const budgetType = document.getElementById('budgetType').value;
    const periodStart = document.getElementById('budgetPeriodStart').value;
    const periodEnd = document.getElementById('budgetPeriodEnd').value;
    
    // Si no hay fechas, calcularlas automáticamente
    let finalPeriodStart = periodStart;
    let finalPeriodEnd = periodEnd;
    
    if (!periodStart || !periodEnd) {
        const calculatedDates = calculatePeriodDates(period);
        finalPeriodStart = calculatedDates.periodStart;
        finalPeriodEnd = calculatedDates.periodEnd;
    }
    
    // Calcular monto basado en el tipo de presupuesto
    let budgetedAmount = 0;
    let percentage = null;
    
    if (budgetType === 'fixed') {
        budgetedAmount = parseFloat(document.getElementById('budgetAmount').value) || 0;
    } else if (budgetType === 'percentage') {
        percentage = parseFloat(document.getElementById('budgetPercentage').value) || 0;
        // Para presupuestos porcentuales, el monto se calculará en el backend
        // basándose en los ingresos del período
        budgetedAmount = 0; // Se calculará automáticamente
    }
    
    // Get multiple categories
    const categories = getBudgetCategories();
    if (categories.length === 0) {
        showError('Debe agregar al menos una categoría al presupuesto');
        return;
    }
    
    // Calculate budgeted amount per category
    const amountPerCategory = budgetType === 'fixed' ? 
        Math.round(budgetedAmount / categories.length) : 0;
    
    const budgetData = {
        name: document.getElementById('budgetName').value,
        month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        year: new Date().getFullYear(),
        period: period,
        periodStart: finalPeriodStart,
        periodEnd: finalPeriodEnd,
        budgetType: budgetType,
        percentage: percentage,
        categories: categories.map(cat => ({
            ...cat,
            budgeted: amountPerCategory
        })),
        totalBudgeted: budgetedAmount,
        status: 'draft'
    };
    
    // Validation
    if (!budgetData.name || !budgetData.period || !budgetData.budgetType) {
        showError('Por favor completa todos los campos requeridos, incluyendo el nombre del presupuesto');
        return;
    }
    
    if (budgetType === 'fixed' && budgetedAmount <= 0) {
        showError('El monto debe ser mayor a 0 para presupuestos de monto fijo');
        return;
    }
    
    if (budgetType === 'percentage' && (!percentage || percentage <= 0 || percentage > 100)) {
        showError('El porcentaje debe estar entre 1 y 100 para presupuestos porcentuales');
        return;
    }
    
    try {
        let result;
        if (editingItem) {
            result = await apiCall(`/budgets/${editingItem.id}`, 'PUT', budgetData);
        } else {
            result = await apiCall('/budgets', 'POST', budgetData);
        }
        
        if (result) {
            showSuccess(editingItem ? 'Presupuesto actualizado exitosamente' : 'Presupuesto creado exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('budgetModal')).hide();
            loadBudgets();
            loadDashboard(); // Refresh dashboard
        }
    } catch (error) {
        if (error.status === 409) {
            // Ya existe un presupuesto para este mes
            const existingBudget = error.data?.existingBudget;
            if (existingBudget && confirm(`Ya existe un presupuesto para ${budgetData.month}. ¿Deseas editarlo en su lugar?`)) {
                // Cargar el presupuesto existente para editar
                editBudget(existingBudget);
            } else {
                showError('Ya existe un presupuesto para este mes. Por favor, selecciona un mes diferente o edita el presupuesto existente.');
            }
        } else {
            showError('Error al guardar el presupuesto: ' + error.message);
        }
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Budget activation functions
async function activateBudget(budgetId) {
    try {
        const budget = budgets.find(b => b.id === budgetId);
        if (!budget) {
            showError('Presupuesto no encontrado');
            return;
        }
        
        const updatedBudget = { ...budget, status: 'active' };
        const result = await apiCall(`/budgets/${budgetId}`, 'PUT', updatedBudget);
        
        if (result) {
            // Update local budget
            const index = budgets.findIndex(b => b.id === budgetId);
            if (index !== -1) {
                budgets[index] = { ...budgets[index], status: 'active' };
            }
            
            updateBudgetsList();
            showSuccess('Presupuesto activado correctamente');
        }
    } catch (error) {
        console.error('Error activating budget:', error);
        
        // Show specific error message from backend
        if (error.status === 400 && error.data && error.data.error) {
            showError(error.data.error);
        } else {
            showError('Error al activar el presupuesto: ' + (error.message || 'Error desconocido'));
        }
    }
}

async function deactivateBudget(budgetId) {
    try {
        const budget = budgets.find(b => b.id === budgetId);
        if (!budget) {
            showError('Presupuesto no encontrado');
            return;
        }
        
        const updatedBudget = { ...budget, status: 'draft' };
        const result = await apiCall(`/budgets/${budgetId}`, 'PUT', updatedBudget);
        
        if (result) {
            // Update local budget
            const index = budgets.findIndex(b => b.id === budgetId);
            if (index !== -1) {
                budgets[index] = { ...budgets[index], status: 'draft' };
            }
            
            updateBudgetsList();
            showSuccess('Presupuesto desactivado correctamente');
        }
    } catch (error) {
        console.error('Error deactivating budget:', error);
        showError('Error al desactivar el presupuesto');
    }
}

// Budget selector functions
function populateBudgetSelect(selectId, selectedBudgetId = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    console.log(`Poblando selector ${selectId} con ${budgets.length} presupuestos disponibles`);
    
    // Filter budgets for active budgets (not filtered by period for expense creation)
    const activeBudgets = budgets.filter(budget => 
        budget.isActive && budget.status === 'active'
    );
    
    console.log(`Presupuestos activos encontrados: ${activeBudgets.length}`);
    
    select.innerHTML = '<option value="">Seleccionar presupuesto</option>';
    
    // Add unbudgeted option
    const unbudgetedOption = document.createElement('option');
    unbudgetedOption.value = 'unbudgeted';
    unbudgetedOption.textContent = '⚠️ Sin presupuesto (No recomendado)';
    unbudgetedOption.style.color = '#dc3545';
    select.appendChild(unbudgetedOption);
    
    if (activeBudgets.length === 0) {
        select.innerHTML += '<option value="" disabled>No hay presupuestos activos</option>';
        return;
    }
    
    activeBudgets.forEach(budget => {
        const option = document.createElement('option');
        option.value = budget.id;
        const periodLabel = getPeriodLabel(budget.period || 'monthly');
        const budgetName = budget.name || `Presupuesto ${budget.month}/${budget.year}`;
        option.textContent = `${budgetName} - ${periodLabel} - ${budget.categories.length} categorías`;
        if (selectedBudgetId && budget.id === selectedBudgetId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // Add change event listener to update categories (only for expense budget selector)
    if (selectId === 'expenseBudget') {
        select.addEventListener('change', updateExpenseCategories);
    }
}

function getPeriodLabel(period) {
    const labels = {
        'monthly': 'Mensual',
        'quarterly': 'Trimestral',
        'semiannual': 'Semestral',
        'annual': 'Anual'
    };
    return labels[period] || 'Mensual';
}

function updateBudgetPeriodDates() {
    const period = document.getElementById('budgetPeriod').value;
    const startDate = document.getElementById('budgetPeriodStart');
    const endDate = document.getElementById('budgetPeriodEnd');
    
    if (!period) {
        startDate.value = '';
        endDate.value = '';
        return;
    }
    
    const today = new Date();
    const dates = calculatePeriodDates(period, today);
    
    startDate.value = dates.periodStart;
    endDate.value = dates.periodEnd;
}

function toggleBudgetInputs() {
    const budgetType = document.getElementById('budgetType').value;
    const amountInput = document.getElementById('amountInput');
    const percentageInput = document.getElementById('percentageInput');
    const amountField = document.getElementById('budgetAmount');
    const percentageField = document.getElementById('budgetPercentage');
    
    if (budgetType === 'percentage') {
        amountInput.style.display = 'none';
        percentageInput.style.display = 'block';
        amountField.required = false;
        percentageField.required = true;
    } else {
        amountInput.style.display = 'block';
        percentageInput.style.display = 'none';
        amountField.required = true;
        percentageField.required = false;
    }
}

function toggleBudgetWarning() {
    const budgetSelect = document.getElementById('expenseBudget');
    const warningDiv = document.getElementById('budgetWarning');
    
    if (budgetSelect.value === 'unbudgeted') {
        warningDiv.style.display = 'block';
    } else {
        warningDiv.style.display = 'none';
    }
}

function updateExpenseCategories() {
    const budgetSelect = document.getElementById('expenseBudget');
    const categorySelect = document.getElementById('expenseCategory');
    
    if (!budgetSelect || !categorySelect) return;
    
    // Clear existing options
    if (budgetSelect.value === 'unbudgeted') {
        categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    } else if (!budgetSelect.value) {
        categorySelect.innerHTML = '<option value="">Primero selecciona un presupuesto</option>';
    } else {
        categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    }
    
    if (budgetSelect.value === 'unbudgeted') {
        // For unbudgeted expenses, show general categories
        const generalCategories = [
            'Alimentación', 'Transporte', 'Vivienda', 'Salud', 
            'Educación', 'Entretenimiento', 'Servicios', 'Compras', 'Otros'
        ];
        
        generalCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.toLowerCase();
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    } else {
        // For budgeted expenses, show budget-specific categories
        const selectedBudget = budgets.find(budget => budget.id === budgetSelect.value);
        if (selectedBudget && selectedBudget.categories) {
            selectedBudget.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.category;
                option.textContent = category.category;
                categorySelect.appendChild(option);
            });
        }
    }
}

// Functions for managing multiple categories in budget form
function addCategory() {
    const container = document.getElementById('budgetCategoriesContainer');
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item mb-2';
    categoryItem.innerHTML = `
        <div class="input-group">
            <input type="text" class="form-control budget-category-input" placeholder="ej: Servicios, Materiales, Supermercado" required>
            <button type="button" class="btn btn-outline-danger" onclick="removeCategory(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(categoryItem);
    
    // Show remove buttons for all items if there are more than 1
    updateCategoryButtons();
}

function removeCategory(button) {
    const categoryItem = button.closest('.category-item');
    categoryItem.remove();
    updateCategoryButtons();
}

function updateCategoryButtons() {
    const categoryItems = document.querySelectorAll('.category-item');
    const removeButtons = document.querySelectorAll('.category-item .btn-outline-danger');
    
    // Show remove buttons only if there are more than 1 category
    removeButtons.forEach(button => {
        button.style.display = categoryItems.length > 1 ? 'block' : 'none';
    });
}

function getBudgetCategories() {
    const categoryInputs = document.querySelectorAll('.budget-category-input');
    const categories = [];
    
    categoryInputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            categories.push({
                category: value,
                budgeted: 0, // Will be calculated based on budget type
                spent: 0,
                remaining: 0
            });
        }
    });
    
    return categories;
}

function calculatePeriodDates(period, baseDate = new Date()) {
    const cutoffDay = cutoffConfig.cutoffDay;
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
            // Fallback a mensual
            const fallbackStartMonth = financialMonth === 1 ? 12 : financialMonth - 1;
            const fallbackStartYear = financialMonth === 1 ? financialYear - 1 : financialYear;
            periodStart = new Date(fallbackStartYear, fallbackStartMonth - 1, cutoffDay);
            periodEnd = new Date(financialYear, financialMonth - 1, cutoffDay - 1);
    }
    
    return {
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0]
    };
}

function showError(message) {
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of current section
    const currentSectionEl = document.getElementById(currentSection + '-section');
    currentSectionEl.insertBefore(alert, currentSectionEl.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of current section
    const currentSectionEl = document.getElementById(currentSection + '-section');
    currentSectionEl.insertBefore(alert, currentSectionEl.firstChild);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 3000);
}

// Edit functions
function editAccount(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    editingItem = account;
    document.getElementById('accountModalTitle').textContent = 'Editar Cuenta';
    document.getElementById('accountName').value = account.name;
    document.getElementById('accountType').value = account.type;
    document.getElementById('accountBank').value = account.bank || '';
    document.getElementById('accountNumber').value = account.accountNumber || '';
    document.getElementById('accountBalance').value = account.balance;
    document.getElementById('accountCurrency').value = account.currency;
    
    // Make bank and account number required for non-cash accounts
    if (account.type !== 'cash') {
        document.getElementById('accountBank').required = true;
        document.getElementById('accountNumber').required = true;
    }
    
    new bootstrap.Modal(document.getElementById('accountModal')).show();
}

function editIncome(incomeId) {
    const income = incomes.find(inc => inc.id === incomeId);
    if (!income) return;
    
    editingItem = income;
    document.getElementById('incomeModalTitle').textContent = 'Editar Ingreso';
    document.getElementById('incomeDescription').value = income.description;
    document.getElementById('incomeAmount').value = income.amount;
    document.getElementById('incomeCategory').value = income.category;
    document.getElementById('incomeDate').value = income.date;
    document.getElementById('incomeAccount').value = income.accountId;
    document.getElementById('incomeCurrency').value = income.currency;
    document.getElementById('incomeRecurring').checked = income.isRecurring;
    document.getElementById('incomeRecurringPattern').value = income.recurringPattern || 'monthly';
    
    populateAccountSelect('incomeAccount');
    
    // Show/hide recurring pattern
    const recurringPatternDiv = document.getElementById('recurringPatternDiv');
    if (recurringPatternDiv) {
        recurringPatternDiv.style.display = income.isRecurring ? 'block' : 'none';
    }
    
    new bootstrap.Modal(document.getElementById('incomeModal')).show();
}

function editExpense(expenseId) {
    const expense = expenses.find(exp => exp.id === expenseId);
    if (!expense) return;
    
    editingItem = expense;
    document.getElementById('expenseModalTitle').textContent = 'Editar Gasto';
    document.getElementById('expenseDescription').value = expense.description;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseCategory').value = expense.category;
    document.getElementById('expenseDate').value = expense.date;
    document.getElementById('expenseAccount').value = expense.accountId;
    document.getElementById('expenseBudget').value = expense.budgetId || 'unbudgeted';
    document.getElementById('expenseCurrency').value = expense.currency;
    
    populateAccountSelect('expenseAccount');
    populateBudgetSelect('expenseBudget', expense.budgetId);
    
    // Show warning if unbudgeted
    toggleBudgetWarning();
    
    new bootstrap.Modal(document.getElementById('expenseModal')).show();
}

function editBudget(budgetId) {
    const budget = budgets.find(bud => bud.id === budgetId);
    if (!budget) return;
    
    editingItem = budget;
    document.getElementById('budgetModalTitle').textContent = 'Editar Presupuesto';
    document.getElementById('budgetName').value = budget.name || '';
    document.getElementById('budgetType').value = budget.budgetType || 'fixed';
    document.getElementById('budgetAmount').value = budget.amount || '';
    document.getElementById('budgetPercentage').value = budget.percentage || '';
    document.getElementById('budgetPeriod').value = budget.period || 'monthly';
    document.getElementById('budgetCurrency').value = budget.currency || 'COP';
    
    // Load multiple categories
    loadBudgetCategories(budget.categories || []);
    
    // Configurar inputs según el tipo
    toggleBudgetInputs();
    
    // Establecer fechas del presupuesto existente
    if (budget.periodStart) {
        document.getElementById('budgetPeriodStart').value = budget.periodStart;
    }
    if (budget.periodEnd) {
        document.getElementById('budgetPeriodEnd').value = budget.periodEnd;
    }
    
    new bootstrap.Modal(document.getElementById('budgetModal')).show();
}

function loadBudgetCategories(categories) {
    const container = document.getElementById('budgetCategoriesContainer');
    container.innerHTML = '';
    
    if (categories.length === 0) {
        // Add one empty category
        addCategory();
    } else {
        categories.forEach((category, index) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item mb-2';
            categoryItem.innerHTML = `
                <div class="input-group">
                    <input type="text" class="form-control budget-category-input" placeholder="ej: Servicios, Materiales, Supermercado" required value="${category.category}">
                    <button type="button" class="btn btn-outline-danger" onclick="removeCategory(this)" ${categories.length === 1 ? 'style="display: none;"' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(categoryItem);
        });
    }
    
    updateCategoryButtons();
}

// Delete functions
async function deleteAccount(accountId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cuenta?')) return;
    
    try {
        const result = await apiCall(`/accounts/${accountId}`, 'DELETE');
        if (result) {
            showSuccess('Cuenta eliminada exitosamente');
            loadAccounts();
            loadDashboard();
        }
    } catch (error) {
        showError('Error al eliminar la cuenta: ' + error.message);
    }
}

async function deleteIncome(incomeId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este ingreso?')) return;
    
    try {
        const result = await apiCall(`/incomes/${incomeId}`, 'DELETE');
        if (result) {
            showSuccess('Ingreso eliminado exitosamente');
            loadIncomes();
            loadDashboard();
        }
    } catch (error) {
        showError('Error al eliminar el ingreso: ' + error.message);
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) return;
    
    try {
        const result = await apiCall(`/expenses/${expenseId}`, 'DELETE');
        if (result) {
            showSuccess('Gasto eliminado exitosamente');
            loadExpenses();
            loadDashboard();
        }
    } catch (error) {
        showError('Error al eliminar el gasto: ' + error.message);
    }
}

async function deleteBudget(budgetId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) return;
    
    try {
        const result = await apiCall(`/budgets/${budgetId}`, 'DELETE');
        if (result) {
            showSuccess('Presupuesto eliminado exitosamente');
            loadBudgets();
            loadDashboard();
        }
    } catch (error) {
        showError('Error al eliminar el presupuesto: ' + error.message);
    }
}
