// U-Control - Simple Frontend
// Configuration
const API_BASE_URL = 'http://localhost:3001/dev';

// Global state
let currentSection = 'dashboard';
let accounts = [];
let incomes = [];
let expenses = [];
let budgets = [];
let editingItem = null; // For edit operations

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadModals();
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
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
        if (incomesData) incomes = incomesData.incomes || [];
        if (expensesData) expenses = expensesData.expenses || [];
        if (budgetsData) budgets = budgetsData.budgets || [];
        
        updateDashboard();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Error al cargar el dashboard');
    }
}

function updateDashboard() {
    // Calculate totals
    const totalIncomes = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const balance = totalIncomes - totalExpenses;
    
    // Update cards
    document.getElementById('total-incomes').textContent = formatCurrency(totalIncomes);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('balance').textContent = formatCurrency(balance);
    document.getElementById('total-accounts').textContent = accounts.length;
    
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
        incomes = data.incomes || [];
        updateIncomesList();
    }
}

function updateIncomesList() {
    const container = document.getElementById('incomes-list');
    
    if (incomes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-arrow-up"></i>
                <h5>No hay ingresos registrados</h5>
                <p>Agrega tu primer ingreso para comenzar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = incomes.map(income => `
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
        expenses = data.expenses || [];
        updateExpensesList();
    }
}

function updateExpensesList() {
    const container = document.getElementById('expenses-list');
    
    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-arrow-down"></i>
                <h5>No hay gastos registrados</h5>
                <p>Agrega tu primer gasto para comenzar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = expenses.map(expense => `
        <div class="list-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="list-item-title">${expense.description}</h6>
                    <small class="text-muted">${expense.date} • ${expense.category}</small>
                </div>
                <div class="d-flex align-items-center">
                    <div class="text-end me-3">
                        <div class="list-item-amount amount-negative">${formatCurrency(expense.amount)}</div>
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
    `).join('');
}

// Budgets functions
async function loadBudgets() {
    const data = await apiCall('/budgets');
    if (data) {
        budgets = data.budgets || [];
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
    
    container.innerHTML = budgets.map(budget => `
        <div class="list-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="list-item-title">Presupuesto ${budget.month}/${budget.year}</h6>
                    <small class="text-muted">${budget.categories.length} categorías • Estado: ${budget.status}</small>
                </div>
                <div class="d-flex align-items-center">
                    <div class="text-end me-3">
                        <div class="list-item-amount amount-neutral">${formatCurrency(budget.totalBudgeted)}</div>
                        <small class="text-muted">Total presupuestado</small>
                    </div>
                    <div class="btn-group" role="group">
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
    `).join('');
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
    editingItem = null;
    document.getElementById('expenseModalTitle').textContent = 'Agregar Gasto';
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    populateAccountSelect('expenseAccount');
    new bootstrap.Modal(document.getElementById('expenseModal')).show();
}

function showAddBudgetModal() {
    editingItem = null;
    document.getElementById('budgetModalTitle').textContent = 'Agregar Presupuesto';
    document.getElementById('budgetForm').reset();
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
        }
    } catch (error) {
        showError('Error al guardar el ingreso: ' + error.message);
    }
}

async function saveExpense() {
    const expenseData = {
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value) || 0,
        category: document.getElementById('expenseCategory').value,
        date: document.getElementById('expenseDate').value,
        accountId: document.getElementById('expenseAccount').value,
        currency: document.getElementById('expenseCurrency').value
    };
    
    // Validation
    if (!expenseData.description || !expenseData.amount || !expenseData.category || !expenseData.date || !expenseData.accountId) {
        showError('Por favor completa todos los campos requeridos');
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
    const budgetData = {
        month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        year: new Date().getFullYear(),
        categories: [{
            category: document.getElementById('budgetCategory').value,
            budgeted: parseFloat(document.getElementById('budgetAmount').value) || 0
        }],
        totalBudgeted: parseFloat(document.getElementById('budgetAmount').value) || 0,
        status: 'draft'
    };
    
    // Validation
    if (!budgetData.categories[0].category || !budgetData.categories[0].budgeted) {
        showError('Por favor completa todos los campos requeridos');
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
        showError('Error al guardar el presupuesto: ' + error.message);
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
    document.getElementById('expenseCurrency').value = expense.currency;
    
    populateAccountSelect('expenseAccount');
    
    new bootstrap.Modal(document.getElementById('expenseModal')).show();
}

function editBudget(budgetId) {
    const budget = budgets.find(bud => bud.id === budgetId);
    if (!budget) return;
    
    editingItem = budget;
    document.getElementById('budgetModalTitle').textContent = 'Editar Presupuesto';
    document.getElementById('budgetName').value = budget.name;
    document.getElementById('budgetAmount').value = budget.amount;
    document.getElementById('budgetCategory').value = budget.category;
    document.getElementById('budgetPeriod').value = budget.period;
    document.getElementById('budgetCurrency').value = budget.currency;
    
    new bootstrap.Modal(document.getElementById('budgetModal')).show();
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
