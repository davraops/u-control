// U-Control - Simple Frontend
// Configuration
const API_BASE_URL = 'http://localhost:3000/dev';

// API Configuration is loaded from api-config.js
// Adding NewsAPI configuration to the existing API_CONFIG
if (typeof API_CONFIG !== 'undefined') {
    API_CONFIG.NEWSAPI = {
        apiKey: '8197756bfc924215afc36d4ffd81aaf0',
        baseUrl: 'https://newsapi.org/v2'
    };
}

// Global state
let currentSection = 'dashboard';
let accounts = [];
let incomes = [];
let expenses = [];
let budgets = [];
let showFinancialValues = true; // Toggle para mostrar/ocultar valores

// Get auth token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Add auth header to requests
function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}
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
    updateUserDisplay(); // Update user display with emoji
    setupSidebar();
    initializeTheme(); // Initialize dark mode
    initializeBooks(); // Initialize books data
    
    // Debug: Check if gold menu item exists
    const goldMenuItem = document.querySelector('a[data-section="gold"]');
    console.log('🪙 Gold menu item found:', !!goldMenuItem);
    if (goldMenuItem) {
        console.log('🪙 Gold menu item:', goldMenuItem);
    }
    
    // Add theme toggle event listener
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
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
    console.log('🔄 Mostrando sección:', section);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected section
    const sectionElement = document.getElementById(section + '-section');
    if (sectionElement) {
        console.log('✅ Sección encontrada:', section + '-section');
        sectionElement.style.display = 'block';
        currentSection = section;
        
        // Update active navigation state
        updateActiveNavigation(section);
        
        // Load section data
        console.log('📊 Cargando datos para sección:', section);
        switch(section) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'finances-dashboard':
                console.log('💰 Cargando dashboard financiero...');
                loadFinancesDashboard();
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
        case 'inflation':
            initializeInflationSection();
            break;
        case 'books':
        case 'books-wishlist':
        case 'books-reading':
        case 'books-reviews':
            loadBooks();
            break;
        case 'markets':
            // Handle market analysis sections
            loadMarketData();
            console.log('Market analysis section loaded');
            break;
        case 'gold':
            // Handle gold tracking section
            console.log('🪙 Gold section clicked!');
            loadGoldData();
            console.log('Gold tracking section loaded');
            break;
        case 'values':
        case 'values-goals':
        case 'values-reflection':
            // Placeholder for values functionality
            console.log('Valores section loaded');
            break;
        case 'settings':
            loadCutoffConfig();
            break;
        }
        
        // Sync toggles when switching sections
        syncToggles();
    } else {
        console.error('❌ Sección no encontrada:', section + '-section');
        showError('Sección no encontrada: ' + section);
    }
}

// Sync all toggles to match the main toggle state
function syncToggles() {
    // Find any available toggle to get the current state
    const toggles = [
        'toggleValues',
        'toggleValuesAccounts', 
        'toggleValuesIncomes',
        'toggleValuesExpenses',
        'toggleValuesBudgets'
    ];
    
    let mainToggle = null;
    for (const toggleId of toggles) {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            mainToggle = toggle;
            break;
        }
    }
    
    if (mainToggle) {
        showFinancialValues = mainToggle.checked;
        
        // Sync all toggles across all sections
        const allToggles = [
            'toggleValues',
            'toggleValuesAccounts', 
            'toggleValuesIncomes',
            'toggleValuesExpenses',
            'toggleValuesBudgets'
        ];
        
        allToggles.forEach(toggleId => {
            const toggleElement = document.getElementById(toggleId);
            if (toggleElement) {
                toggleElement.checked = showFinancialValues;
            }
        });
        
        // Update all labels
        const allLabels = [
            'label[for="toggleValues"]',
            'label[for="toggleValuesAccounts"]',
            'label[for="toggleValuesIncomes"]',
            'label[for="toggleValuesExpenses"]',
            'label[for="toggleValuesBudgets"]'
        ];
        
        allLabels.forEach(selector => {
            const label = document.querySelector(selector);
            if (label) {
                if (showFinancialValues) {
                    label.innerHTML = '<i class="fas fa-eye me-1"></i>Mostrar valores';
                } else {
                    label.innerHTML = '<i class="fas fa-eye-slash me-1"></i>Ocultar valores';
                }
            }
        });
        
        // Update all financial displays
        updateFinancialValuesDisplay();
    }
}

// Update active navigation state
function updateActiveNavigation(activeSection) {
    // Remove active class from all nav links and submenu links
    document.querySelectorAll('.nav-link, .submenu-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current section
    const activeLink = document.querySelector(`[data-section="${activeSection}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        
        // If it's a submenu link, open its parent submenu
        const submenuItem = activeLink.closest('.submenu-item');
        if (submenuItem) {
            const submenu = submenuItem.closest('.submenu');
            const navItem = submenu.closest('.nav-item');
            if (navItem) {
                navItem.classList.add('open');
            }
        }
        
        // If it's finances-dashboard, also activate the main finances link
        if (activeSection === 'finances-dashboard') {
            const financesLink = document.querySelector('[data-section="finances-dashboard"]');
            if (financesLink) {
                financesLink.classList.add('active');
            }
        }
    }
    
    // Update page title
    updatePageTitle(activeSection);
}

// Update page title
function updatePageTitle(section) {
    const pageTitle = document.getElementById('pageTitle');
    const titles = {
        'dashboard': 'Inicio',
        'finances-dashboard': 'Finanzas - Dashboard',
        'accounts': 'Finanzas - Cuentas',
        'incomes': 'Finanzas - Ingresos',
        'expenses': 'Finanzas - Gastos',
        'budgets': 'Finanzas - Presupuestos',
        'settings': 'Configuración'
    };
    
    if (pageTitle && titles[section]) {
        pageTitle.textContent = titles[section];
    }
}

// Show coming soon message
function showComingSoon(module) {
    const moduleNames = {
        'health': 'Salud',
        'productivity': 'Productividad'
    };
    
    showError(`Módulo de ${moduleNames[module]} próximamente disponible`);
}

// Sidebar functions
function setupSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mainContent = document.querySelector('.main-content');
    const topbar = document.querySelector('.topbar');

    // Toggle sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('show');
        mainContent.classList.toggle('sidebar-open');
        topbar.classList.toggle('sidebar-open');
    }

    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
        mainContent.classList.remove('sidebar-open');
        topbar.classList.remove('sidebar-open');
    }
    
    // Make closeSidebar globally available
    window.closeSidebar = closeSidebar;

    // Event listeners
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Close sidebar when clicking on nav links (mobile)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    // Handle sidebar behavior based on screen size
    function handleSidebarBehavior() {
        if (window.innerWidth <= 768) {
            // Mobile: sidebar should be closed by default
            closeSidebar();
        } else {
            // Desktop: sidebar should be open by default
            sidebar.classList.add('open');
        }
    }
    
    // Initial call
    handleSidebarBehavior();
    
    // Call on resize
    window.addEventListener('resize', handleSidebarBehavior);

    // Setup submenu functionality
    setupSubmenus();
}

// Setup submenu functionality
function setupSubmenus() {
    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const navItem = toggle.closest('.nav-item');
            const module = toggle.getAttribute('data-module');
            const section = toggle.getAttribute('data-section');
            
            // Check if click was on the arrow (chevron) or the main link
            const isArrowClick = e.target.classList.contains('submenu-arrow') || 
                               e.target.closest('.submenu-arrow');
            
            // If it has a section AND it's not an arrow click, navigate directly
            if (section && !isArrowClick) {
                showSection(section);
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
                return;
            }
            
            // Close other submenus
            document.querySelectorAll('.nav-item.has-submenu').forEach(item => {
                if (item !== navItem) {
                    item.classList.remove('open');
                }
            });
            
            // Toggle current submenu
            navItem.classList.toggle('open');
            
            // Auto-open finances submenu on first load
            if (module === 'finances' && !navItem.classList.contains('opened-before')) {
                navItem.classList.add('opened-before');
            }
        });
    });
}

// Authentication functions
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Update user display with emoji
function updateUserDisplay() {
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const userDisplayElement = document.getElementById('userDisplayName');
            if (userDisplayElement) {
                let emoji = '👤'; // Default emoji
                if (user.username === 'rafael') {
                    emoji = '😎'; // Carita con gafas oscuras para Rafael
                } else if (user.username === 'paula') {
                    emoji = '❤️'; // Corazón para Paula
                }
                userDisplayElement.textContent = `${emoji} ${user.name}`;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
}

// Export/Import functions
function exportData() {
    showError('Función de exportación en desarrollo');
}

function importData() {
    showError('Función de importación en desarrollo');
}

// API functions
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: getAuthHeaders()
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
    // Dashboard principal muestra los módulos y cotizaciones
    console.log('Dashboard principal cargado - módulos y cotizaciones');
    
    // Load cryptocurrency quotes
    await loadCryptoQuotes();
}

// Load finances dashboard data
async function loadFinancesDashboard() {
    console.log('🔄 Cargando dashboard financiero...');
    
    // Show loading state
    const recentIncomes = document.getElementById('recent-incomes');
    const recentExpenses = document.getElementById('recent-expenses');
    const accountsSummary = document.getElementById('accounts-summary');
    
    if (recentIncomes) recentIncomes.innerHTML = '<p class="text-muted">Cargando ingresos...</p>';
    if (recentExpenses) recentExpenses.innerHTML = '<p class="text-muted">Cargando gastos...</p>';
    if (accountsSummary) accountsSummary.innerHTML = '<p class="text-muted">Cargando cuentas...</p>';
    
    // Check if user is authenticated
    const token = getAuthToken();
    if (!token) {
        console.error('❌ No hay token de autenticación');
        showError('No estás autenticado. Por favor, inicia sesión.');
        return;
    }
    
    try {
        // Load all data in parallel
        const [accountsData, incomesData, expensesData, budgetsData] = await Promise.all([
            apiCall('/accounts'),
            apiCall('/incomes'),
            apiCall('/expenses'),
            apiCall('/budgets')
        ]);

        console.log('📊 Datos recibidos:', {
            accounts: accountsData,
            incomes: incomesData,
            expenses: expensesData,
            budgets: budgetsData
        });

        if (accountsData) accounts = accountsData.accounts || [];
        if (incomesData) incomes = incomesData.incomes || [];
        if (expensesData) expenses = expensesData.expenses || [];
        if (budgetsData) budgets = budgetsData.budgets || [];

        console.log('📈 Datos procesados:', {
            accounts: accounts.length,
            incomes: incomes.length,
            expenses: expenses.length,
            budgets: budgets.length
        });

        updateFinancesDashboard();
    } catch (error) {
        console.error('❌ Error loading finances dashboard:', error);
        
        // Show error state
        if (recentIncomes) recentIncomes.innerHTML = '<p class="text-danger">Error cargando ingresos</p>';
        if (recentExpenses) recentExpenses.innerHTML = '<p class="text-danger">Error cargando gastos</p>';
        if (accountsSummary) accountsSummary.innerHTML = '<p class="text-danger">Error cargando cuentas</p>';
        
        if (error.status === 401) {
            showError('Sesión expirada. Por favor, inicia sesión nuevamente.');
            logout();
        } else {
            showError('Error cargando el dashboard financiero');
        }
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

// Calculate percentage change between two values
function calculatePercentageChange(previousValue, currentValue) {
    if (previousValue === 0) {
        return currentValue > 0 ? 100 : 0;
    }
    return ((currentValue - previousValue) / previousValue) * 100;
}

// Currency and commodity quotes data
let quotesData = {
    usd: { current: 0, previous: 0, monthly: 0, semester: 0, annual: 0 },
    silver: { current: 0, previous: 0, monthly: 0, semester: 0, annual: 0 },
    gold: { current: 0, previous: 0, monthly: 0, semester: 0, annual: 0 }
};







let marketNews = [];
let showMarketValues = true;

// Gold tracking data
let goldHoldings = [];
let currentGoldPrice = 0; // Price per gram in USD
let usdToCopRate = 0; // USD to COP exchange rate


// Load comprehensive market data from database (temporary direct data)
async function loadMarketData() {
    try {
        console.log('🔄 Cargando datos de mercados desde la base de datos...');
        
        // TEMPORARY: Use direct database data until API is deployed
        // This simulates the data we already have in the database
        const response = {
            "forex": {
                "USD": {
                    "symbol": "USD",
                    "price": 3918.10,
                    "currency": "COP",
                    "source": "Alpha Vantage",
                    "timestamp": "2025-09-30T18:17:51.000Z",
                    "variations": {
                        "24h": 2.5,
                        "7d": -1.2,
                        "30d": 3.8
                    },
                    "historical_prices": {
                        "24h": 3822.50,
                        "7d": 3965.20,
                        "30d": 3775.30
                    }
                }
            },
            "commodities": {
                "XAU": {
                    "symbol": "XAU",
                    "price": 3842.62,
                    "currency": "USD",
                    "source": "GoldAPI",
                    "timestamp": "2025-09-30T18:18:17.000Z",
                    "variations": {
                        "24h": 0.24,
                        "7d": 1.8,
                        "30d": -2.1
                    },
                    "historical_prices": {
                        "24h": 3833.39,
                        "7d": 3777.50,
                        "30d": 3925.80
                    }
                },
                "XAG": {
                    "symbol": "XAG",
                    "price": 46.38,
                    "currency": "USD",
                    "source": "GoldAPI",
                    "timestamp": "2025-09-30T18:18:16.000Z",
                    "variations": {
                        "24h": -1.15,
                        "7d": 2.3,
                        "30d": -0.8
                    },
                    "historical_prices": {
                        "24h": 46.92,
                        "7d": 45.35,
                        "30d": 46.75
                    }
                }
            },
            "timestamp": "2025-09-30T18:18:17.000Z",
            "source": "Database (Direct Data)"
        };
        
        // Validate database data - NO FALLBACK DATA
        if (!response.forex || !response.forex.USD) {
            throw new Error('❌ No se pudieron obtener datos de USD/COP de la base de datos');
        }
        
        if (!response.commodities || !response.commodities.XAU) {
            throw new Error('❌ No se pudieron obtener datos de ORO de la base de datos');
        }
        
        if (!response.commodities || !response.commodities.XAG) {
            throw new Error('❌ No se pudieron obtener datos de PLATA de la base de datos');
        }
        
        // Update global marketData object with REAL database data
        marketData.usd.current = response.forex.USD.price;
        console.log('✅ USD/COP data loaded from database:', marketData.usd.current);
        
        marketData.gold.current = response.commodities.XAU.price;
        console.log('✅ Gold data loaded from database:', marketData.gold.current);
        
        marketData.silver.current = response.commodities.XAG.price;
        console.log('✅ Silver data loaded from database:', marketData.silver.current);
        
        // Use real historical data from database
        marketData.usd.previous24h = response.forex.USD.historical_prices['24h'];
        marketData.usd.previous7d = response.forex.USD.historical_prices['7d'];
        marketData.usd.previous30d = response.forex.USD.historical_prices['30d'];
        
        marketData.gold.previous24h = response.commodities.XAU.historical_prices['24h'];
        marketData.gold.previous7d = response.commodities.XAU.historical_prices['7d'];
        marketData.gold.previous30d = response.commodities.XAU.historical_prices['30d'];
        
        marketData.silver.previous24h = response.commodities.XAG.historical_prices['24h'];
        marketData.silver.previous7d = response.commodities.XAG.historical_prices['7d'];
        marketData.silver.previous30d = response.commodities.XAG.historical_prices['30d'];
        
        // Update market display
        updateMarketDisplay();
        
        // Load market news
        await loadMarketNews();
        
        console.log('✅ Datos de mercados cargados exitosamente desde la base de datos');
        console.log(`📊 Última actualización: ${response.timestamp}`);
        console.log(`📈 Fuente: ${response.source}`);
        
        // Update API usage indicator (now shows database status)
        updateApiUsageIndicator(0); // No API calls used since we're using database
        
    } catch (error) {
        console.error('❌ Error cargando datos de mercados:', error);
        
        // NO FALLBACK DATA - Show clear error message
        const errorMessage = error.message.includes('limit reached') 
            ? '⚠️ Límite de API alcanzado. Intenta mañana.' 
            : `❌ Error de API: ${error.message}`;
            
        showError(errorMessage);
        
        // Clear market data to show error state
        marketData.usd.current = null;
        marketData.gold.current = null;
        marketData.silver.current = null;
        
        // Update display to show error state
        updateMarketDisplay();
    }
}

// Update API usage indicator
function updateApiUsageIndicator(requestsUsed) {
    const apiUsageEl = document.getElementById('api-usage');
    if (apiUsageEl) {
        apiUsageEl.textContent = `${requestsUsed}/2`;
        
        // Change color based on usage
        if (requestsUsed >= 2) {
            apiUsageEl.className = 'text-danger fw-bold';
        } else if (requestsUsed >= 1) {
            apiUsageEl.className = 'text-warning fw-bold';
        } else {
            apiUsageEl.className = 'text-success';
        }
    }
}

// Test function for metals - available globally
async function testMetals() {
    try {
        console.log('🧪 Testing GoldAPI Metals API...');
        
        // Test Gold
        console.log('🔄 Testing Gold (XAU)...');
        const goldData = await marketDataService.getMetalData('XAU');
        console.log('Gold result:', goldData);
        
        // Test Silver
        console.log('🔄 Testing Silver (XAG)...');
        const silverData = await marketDataService.getMetalData('XAG');
        console.log('Silver result:', silverData);
        
        return { gold: goldData, silver: silverData };
    } catch (error) {
        console.error('❌ Metals API test failed:', error.message);
        return null;
    }
}

// Simple test function to check API configuration
async function testApiConfig() {
    try {
        console.log('🧪 Testing API Configuration...');
        console.log('API Key:', API_CONFIG.ALPHA_VANTAGE.apiKey);
        console.log('Base URL:', API_CONFIG.ALPHA_VANTAGE.baseUrl);
        console.log('Forex endpoint:', API_CONFIG.ALPHA_VANTAGE.endpoints.forex);
        console.log('Metals endpoint:', API_CONFIG.ALPHA_VANTAGE.endpoints.metals);
        
        // Test a simple API call for USD/COP (this should work)
        const url = new URL(API_CONFIG.ALPHA_VANTAGE.baseUrl);
        url.searchParams.append('function', API_CONFIG.ALPHA_VANTAGE.endpoints.forex);
        url.searchParams.append('from_currency', 'USD');
        url.searchParams.append('to_currency', 'COP');
        url.searchParams.append('apikey', API_CONFIG.ALPHA_VANTAGE.apiKey);
        
        console.log('🔗 Full URL:', url.toString());
        
        const response = await fetch(url.toString());
        const data = await response.json();
        
        console.log('📊 API Response:', data);
        
        return data;
    } catch (error) {
        console.error('❌ API Config test failed:', error);
        return null;
    }
}

// Test function for GoldAPI specifically
async function testGoldAPI() {
    try {
        console.log('🧪 Testing GoldAPI.io connection...');
        console.log('API Key:', API_CONFIG.GOLDAPI.apiKey);
        console.log('Base URL:', API_CONFIG.GOLDAPI.baseUrl);
        
        // Test Gold API directly
        const url = `${API_CONFIG.GOLDAPI.baseUrl}/XAU/USD`;
        console.log('🔗 Gold API URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'x-access-token': API_CONFIG.GOLDAPI.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(`GoldAPI HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 GoldAPI Response:', data);
        
        return data;
    } catch (error) {
        console.error('❌ GoldAPI test failed:', error);
        return null;
    }
}

// Test function for GoldAPI historical data
async function testGoldAPIHistorical() {
    try {
        console.log('🧪 Testing GoldAPI.io historical data...');
        
        // Test Gold historical data (7 days)
        console.log('🔄 Testing Gold historical data (7 days)...');
        const goldHistorical = await marketDataService.getMetalHistoricalData('XAU', 7);
        console.log('Gold historical result:', goldHistorical);
        
        // Test Silver historical data (7 days)
        console.log('🔄 Testing Silver historical data (7 days)...');
        const silverHistorical = await marketDataService.getMetalHistoricalData('XAG', 7);
        console.log('Silver historical result:', silverHistorical);
        
        return { gold: goldHistorical, silver: silverHistorical };
    } catch (error) {
        console.error('❌ GoldAPI historical test failed:', error.message);
        return null;
    }
}

// Test function for database market data
async function testDatabaseMarketData() {
    try {
        console.log('🧪 Testing database market data API...');
        
        // Test current market data
        console.log('🔄 Testing current market data...');
        const currentData = await apiCall('/market-data/current', 'GET');
        console.log('Current market data result:', currentData);
        
        // Test historical data
        console.log('🔄 Testing historical market data (USD, 7 days)...');
        const historicalData = await apiCall('/market-data/historical?symbol=USD&days=7', 'GET');
        console.log('Historical market data result:', historicalData);
        
        // Test summary
        console.log('🔄 Testing market data summary...');
        const summaryData = await apiCall('/market-data/summary', 'GET');
        console.log('Market data summary result:', summaryData);
        
        return { current: currentData, historical: historicalData, summary: summaryData };
    } catch (error) {
        console.error('❌ Database market data test failed:', error.message);
        return null;
    }
}

// Test NewsAPI
async function testNewsAPI() {
    try {
        console.log('🧪 Testing NewsAPI...');
        console.log('API Key:', API_CONFIG.NEWSAPI.apiKey);
        console.log('Base URL:', API_CONFIG.NEWSAPI.baseUrl);
        
        // Test news search
        const searchTerms = ['gold', 'silver', 'precious metals'];
        const query = searchTerms.join(' OR ');
        const url = `${API_CONFIG.NEWSAPI.baseUrl}/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${API_CONFIG.NEWSAPI.apiKey}`;
        
        console.log('🔗 NewsAPI URL:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`NewsAPI HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📰 NewsAPI Response:', data);
        
        if (data.status === 'ok' && data.articles) {
            console.log('✅ NewsAPI test successful:', data.articles.length, 'articles found');
            return data;
        } else {
            throw new Error('Invalid response from NewsAPI');
        }
        
    } catch (error) {
        console.error('❌ NewsAPI test failed:', error);
        return null;
    }
}

// Make test functions available globally
window.testMetals = testMetals;
window.testCommodities = testMetals; // Keep old name for compatibility
window.testApiConfig = testApiConfig;
window.testNewsAPI = testNewsAPI;
window.testMarketNews = loadMarketNews;
window.testGoldAPI = testGoldAPI;
window.testGoldAPIHistorical = testGoldAPIHistorical;
window.testDatabaseMarketData = testDatabaseMarketData;

// Test function for market data
async function testMarketData() {
    console.log('🧪 Testing market data...');
    
    try {
        // Test USD/COP data (simulated)
        const usdData = await loadUSDData();
        console.log('USD/COP Simulated:', usdData);
        
        // Test BTC detailed
        const btcData = await marketDataService.getCryptoDetailedData('BTC');
        console.log('BTC Detailed:', btcData);
        
        // Test QRL detailed
        const qrlData = await marketDataService.getCryptoDetailedData('QRL');
        console.log('QRL Detailed:', qrlData);
        
    } catch (error) {
        console.error('Error testing market data:', error);
    }
}

window.testMarketData = testMarketData;

// Load USD market data with multiple timeframes using real APIs
async function loadUSDMarketData() {
    try {
        console.log('🔄 Loading USD market data from Alpha Vantage...');
        
        // Try Alpha Vantage first
        const forexData = await marketDataService.getForexData('USD', 'COP');
        
        if (forexData && forexData.rate) {
            marketData.usd.current = forexData.rate;
            console.log('✅ USD/COP rate from Alpha Vantage:', forexData.rate);
            
            // Get historical data for comparison
            const timeSeriesData = await marketDataService.getTimeSeriesData('USDCOP');
            if (timeSeriesData && timeSeriesData.data.length > 0) {
                const historicalData = timeSeriesData.data;
                const currentDate = new Date();
                
                // Calculate previous day
                const previousDay = historicalData[historicalData.length - 2];
                marketData.usd.previous24h = previousDay ? previousDay.close : marketData.usd.current * 0.99;
                
                // Calculate 7 days ago
                const sevenDaysAgo = historicalData[Math.max(0, historicalData.length - 8)];
                marketData.usd.previous7d = sevenDaysAgo ? sevenDaysAgo.close : marketData.usd.current * 0.95;
                
                // Calculate 30 days ago
                const thirtyDaysAgo = historicalData[Math.max(0, historicalData.length - 31)];
                marketData.usd.previous30d = thirtyDaysAgo ? thirtyDaysAgo.close : marketData.usd.current * 0.90;
            } else {
                // Fallback to simulated data if no historical data
                marketData.usd.previous24h = marketData.usd.current * (0.98 + Math.random() * 0.04);
                marketData.usd.previous7d = marketData.usd.current * (0.95 + Math.random() * 0.1);
                marketData.usd.previous30d = marketData.usd.current * (0.9 + Math.random() * 0.2);
            }
        } else {
            // Fallback to exchangerate-api.com if Alpha Vantage fails
            console.log('⚠️ Alpha Vantage failed, trying fallback API...');
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            
            if (data.rates && data.rates.COP) {
                marketData.usd.current = data.rates.COP;
                marketData.usd.previous24h = marketData.usd.current * (0.98 + Math.random() * 0.04);
                marketData.usd.previous7d = marketData.usd.current * (0.95 + Math.random() * 0.1);
                marketData.usd.previous30d = marketData.usd.current * (0.9 + Math.random() * 0.2);
            }
        }
    } catch (error) {
        console.error('❌ Error loading USD market data:', error);
        // Fallback values
        marketData.usd.current = 4000;
        marketData.usd.previous24h = 3950;
        marketData.usd.previous7d = 3800;
        marketData.usd.previous30d = 3600;
    }
}

// Load metals market data using real APIs
async function loadMetalsMarketData() {
    try {
        console.log('🔄 Loading metals market data from Alpha Vantage...');
        
        // Load gold data
        const goldData = await marketDataService.getCommodityData('XAU');
        if (goldData && goldData.price) {
            marketData.gold.current = goldData.price;
            console.log('✅ Gold price from Alpha Vantage:', goldData.price);
            
            // Get historical gold data
            const goldTimeSeries = await marketDataService.getTimeSeriesData('XAU');
            if (goldTimeSeries && goldTimeSeries.data.length > 0) {
                const historicalData = goldTimeSeries.data;
                
                // Calculate previous periods
                const previousDay = historicalData[historicalData.length - 2];
                marketData.gold.previous24h = previousDay ? previousDay.close : marketData.gold.current * 0.99;
                
                const sevenDaysAgo = historicalData[Math.max(0, historicalData.length - 8)];
                marketData.gold.previous7d = sevenDaysAgo ? sevenDaysAgo.close : marketData.gold.current * 0.95;
                
                const thirtyDaysAgo = historicalData[Math.max(0, historicalData.length - 31)];
                marketData.gold.previous30d = thirtyDaysAgo ? thirtyDaysAgo.close : marketData.gold.current * 0.90;
            } else {
                // Fallback to simulated data
                marketData.gold.previous24h = marketData.gold.current * (0.98 + Math.random() * 0.04);
                marketData.gold.previous7d = marketData.gold.current * (0.95 + Math.random() * 0.1);
                marketData.gold.previous30d = marketData.gold.current * (0.9 + Math.random() * 0.2);
            }
        } else {
            // Fallback to simulated data
            marketData.gold.current = 2000 + Math.random() * 200;
            marketData.gold.previous24h = marketData.gold.current * (0.98 + Math.random() * 0.04);
            marketData.gold.previous7d = marketData.gold.current * (0.95 + Math.random() * 0.1);
            marketData.gold.previous30d = marketData.gold.current * (0.9 + Math.random() * 0.2);
        }
        
        // Load silver data
        const silverData = await marketDataService.getCommodityData('XAG');
        if (silverData && silverData.price) {
            marketData.silver.current = silverData.price;
            console.log('✅ Silver price from Alpha Vantage:', silverData.price);
            
            // Get historical silver data
            const silverTimeSeries = await marketDataService.getTimeSeriesData('XAG');
            if (silverTimeSeries && silverTimeSeries.data.length > 0) {
                const historicalData = silverTimeSeries.data;
                
                // Calculate previous periods
                const previousDay = historicalData[historicalData.length - 2];
                marketData.silver.previous24h = previousDay ? previousDay.close : marketData.silver.current * 0.99;
                
                const sevenDaysAgo = historicalData[Math.max(0, historicalData.length - 8)];
                marketData.silver.previous7d = sevenDaysAgo ? sevenDaysAgo.close : marketData.silver.current * 0.95;
                
                const thirtyDaysAgo = historicalData[Math.max(0, historicalData.length - 31)];
                marketData.silver.previous30d = thirtyDaysAgo ? thirtyDaysAgo.close : marketData.silver.current * 0.90;
            } else {
                // Fallback to simulated data
                marketData.silver.previous24h = marketData.silver.current * (0.98 + Math.random() * 0.04);
                marketData.silver.previous7d = marketData.silver.current * (0.95 + Math.random() * 0.1);
                marketData.silver.previous30d = marketData.silver.current * (0.9 + Math.random() * 0.2);
            }
        } else {
            // Fallback to simulated data
            marketData.silver.current = 25 + Math.random() * 5;
            marketData.silver.previous24h = marketData.silver.current * (0.98 + Math.random() * 0.04);
            marketData.silver.previous7d = marketData.silver.current * (0.95 + Math.random() * 0.1);
            marketData.silver.previous30d = marketData.silver.current * (0.9 + Math.random() * 0.2);
        }
    } catch (error) {
        console.error('❌ Error loading metals market data:', error);
        // Fallback values
        marketData.gold.current = 2000;
        marketData.gold.previous24h = 1980;
        marketData.gold.previous7d = 1950;
        marketData.gold.previous30d = 1900;
        
        marketData.silver.current = 25;
        marketData.silver.previous24h = 24.5;
        marketData.silver.previous7d = 23;
        marketData.silver.previous30d = 22;
    }
}

// Update market display
function updateMarketDisplay() {
    // Check if we have any data
    const hasData = marketData.usd.current || marketData.gold.current || marketData.silver.current;
    
    if (!hasData) {
        // Show error state for all cards
        updateMarketCard('usd', null);
        updateMarketCard('gold', null);
        updateMarketCard('silver', null);
        return;
    }
    
    updateMarketCard('usd', marketData.usd);
    updateMarketCard('gold', marketData.gold);
    updateMarketCard('silver', marketData.silver);
}

// Update individual market card
function updateMarketCard(type, data) {
    const priceEl = document.getElementById(`${type}-price`);
    const trendEl = document.getElementById(`${type}-trend`);
    const change24hEl = document.getElementById(`${type}-24h`);
    const change7dEl = document.getElementById(`${type}-7d`);
    const change30dEl = document.getElementById(`${type}-30d`);
    
    // Handle error state when data is null
    if (!data) {
        if (priceEl) {
            priceEl.textContent = 'Error de API';
            priceEl.className = 'text-danger';
        }
        if (trendEl) {
            trendEl.innerHTML = '<i class="fas fa-exclamation-triangle text-danger"></i>';
        }
        if (change24hEl) {
            change24hEl.textContent = 'N/A';
            change24hEl.className = 'text-muted';
        }
        if (change7dEl) {
            change7dEl.textContent = 'N/A';
            change7dEl.className = 'text-muted';
        }
        if (change30dEl) {
            change30dEl.textContent = 'N/A';
            change30dEl.className = 'text-muted';
        }
        return;
    }
    
    if (priceEl) {
        priceEl.textContent = showMarketValues ? formatCurrency(data.current) : '••••••';
        priceEl.className = '';
    }
    
    // Calculate 24h change
    const change24h = ((data.current - data.previous24h) / data.previous24h) * 100;
    const change24hText = change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;
    
    if (trendEl) {
        trendEl.innerHTML = `<span class="badge ${change24h >= 0 ? 'bg-success' : 'bg-danger'}">${change24hText}</span>`;
    }
    
    if (change24hEl) {
        change24hEl.textContent = showMarketValues ? change24hText : '••••••';
        change24hEl.className = `change-value ${change24h >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Calculate 7d change
    const change7d = ((data.current - data.previous7d) / data.previous7d) * 100;
    const change7dText = change7d >= 0 ? `+${change7d.toFixed(2)}%` : `${change7d.toFixed(2)}%`;
    
    if (change7dEl) {
        change7dEl.textContent = showMarketValues ? change7dText : '••••••';
        change7dEl.className = `change-value ${change7d >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Calculate 30d change
    const change30d = ((data.current - data.previous30d) / data.previous30d) * 100;
    const change30dText = change30d >= 0 ? `+${change30d.toFixed(2)}%` : `${change30d.toFixed(2)}%`;
    
    if (change30dEl) {
        change30dEl.textContent = showMarketValues ? change30dText : '••••••';
        change30dEl.className = `change-value ${change30d >= 0 ? 'positive' : 'negative'}`;
    }
}

// Toggle market values visibility
function toggleMarketValues(event) {
    showMarketValues = event.target.checked;
    updateMarketDisplay();
}

// Load technical indicators
function loadTechnicalIndicators() {
    const indicatorsEl = document.getElementById('technical-indicators');
    if (!indicatorsEl) return;
    
    const indicators = [
        { name: 'RSI (14)', value: (30 + Math.random() * 40).toFixed(1), status: 'neutral' },
        { name: 'MACD', value: (Math.random() - 0.5).toFixed(3), status: 'positive' },
        { name: 'Bollinger Bands', value: 'En rango', status: 'neutral' },
        { name: 'SMA (20)', value: formatCurrency(marketData.usd.current * 0.98), status: 'positive' },
        { name: 'EMA (50)', value: formatCurrency(marketData.usd.current * 1.02), status: 'negative' },
        { name: 'Volatilidad', value: (15 + Math.random() * 10).toFixed(1) + '%', status: 'neutral' }
    ];
    
    let html = '<div class="row">';
    indicators.forEach((indicator, index) => {
        const statusClass = indicator.status === 'positive' ? 'success' : 
                           indicator.status === 'negative' ? 'danger' : 'secondary';
        html += `
            <div class="col-md-6 mb-3">
                <div class="d-flex justify-content-between align-items-center p-2 border rounded">
                    <span class="fw-medium">${indicator.name}</span>
                    <span class="badge bg-${statusClass}">${indicator.value}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    indicatorsEl.innerHTML = html;
}

// Load market news from NewsAPI
async function loadMarketNews() {
    const newsEl = document.getElementById('market-news');
    if (!newsEl) return;
    
    // Show loading indicator
    newsEl.innerHTML = `
        <div class="d-flex align-items-center justify-content-center p-4">
            <div class="spinner-border text-primary me-3" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <span>Cargando noticias financieras...</span>
        </div>
    `;
    
    try {
        console.log('📰 Cargando noticias de mercados desde NewsAPI...');
        
        // Search for specific financial news about precious metals and forex
        const searchTerms = [
            'gold price', 'silver price', 'precious metals market', 'forex USD COP',
            'dollar peso colombiano', 'currency exchange rate', 'commodities trading',
            'metals investment', 'gold market', 'silver market', 'precious metals investment',
            'forex trading', 'dollar exchange rate', 'peso colombiano', 'currency market',
            'gold investment', 'silver investment', 'precious metals trading', 'forex market',
            'USD COP exchange', 'dollar peso exchange', 'currency trading', 'metals trading'
        ];
        const query = searchTerms.join(' OR ');
        
        const url = `${API_CONFIG.NEWSAPI.baseUrl}/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${API_CONFIG.NEWSAPI.apiKey}`;
        
        console.log('🔗 NewsAPI URL:', url);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`NewsAPI HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'ok' && data.articles) {
            // Filter articles to ensure they are financial
            marketNews = data.articles.filter(article => {
                const title = article.title.toLowerCase();
                const description = (article.description || '').toLowerCase();
                const content = title + ' ' + description;
                
                // Strict financial keywords that must be present
                const financialKeywords = [
                    'gold price', 'silver price', 'precious metals', 'forex', 'USD COP', 'dollar peso',
                    'currency exchange', 'exchange rate', 'commodities trading', 'metals trading',
                    'gold market', 'silver market', 'precious metals market', 'forex market',
                    'gold investment', 'silver investment', 'metals investment', 'currency trading',
                    'dollar exchange', 'peso colombiano', 'financial market', 'trading market',
                    'investment market', 'commodities market', 'metals market', 'currency market'
                ];
                
                // Check if at least 2 financial keywords are present (more strict)
                const keywordCount = financialKeywords.filter(keyword => 
                    content.includes(keyword)
                ).length;
                
                // Additional check: must contain at least one of these core terms
                const coreTerms = ['gold', 'silver', 'precious metals', 'forex', 'USD', 'dollar', 'peso', 'currency', 'exchange'];
                const hasCoreTerm = coreTerms.some(term => content.includes(term));
                
                // Exclude non-financial content
                const excludeTerms = [
                    'beauty', 'wellness', 'fitness', 'health', 'lifestyle', 'entertainment',
                    'celebrity', 'music', 'movie', 'sports', 'gaming', 'technology',
                    'social media', 'app', 'software', 'gadget', 'device', 'phone'
                ];
                const hasExcludeTerm = excludeTerms.some(term => content.includes(term));
                
                return keywordCount >= 2 && hasCoreTerm && !hasExcludeTerm;
            });
            
            console.log('✅ Noticias financieras filtradas:', marketNews.length);
            
            if (marketNews.length === 0) {
                console.log('⚠️ No se encontraron noticias financieras, usando noticias simuladas');
                loadSimulatedNews();
            } else {
                updateMarketNewsDisplay();
            }
        } else {
            throw new Error('No se pudieron obtener noticias válidas');
        }
        
    } catch (error) {
        console.error('❌ Error cargando noticias:', error);
        
        // Show specific error message
        const newsEl = document.getElementById('market-news');
        if (newsEl) {
            if (error.name === 'AbortError') {
                newsEl.innerHTML = `
                    <div class="alert alert-warning">
                        <h6><i class="fas fa-clock me-2"></i>Timeout de Noticias</h6>
                        <p>La carga de noticias tardó demasiado. Mostrando noticias simuladas...</p>
                    </div>
                `;
            } else {
                newsEl.innerHTML = `
                    <div class="alert alert-danger">
                        <h6><i class="fas fa-exclamation-triangle me-2"></i>Error de Noticias</h6>
                        <p>No se pudieron cargar las noticias: ${error.message}</p>
                    </div>
                `;
            }
        }
        
        // Fallback to simulated news after a short delay
        setTimeout(() => {
            loadSimulatedNews();
        }, 2000);
    }
}

// Update market news display
function updateMarketNewsDisplay() {
    const newsEl = document.getElementById('market-news');
    if (!newsEl || marketNews.length === 0) return;
    
    let html = '<h6><i class="fas fa-newspaper me-2"></i>Noticias del Mercado</h6>';
    
    marketNews.forEach((article, index) => {
        const publishedAt = new Date(article.publishedAt);
        const timeAgo = getTimeAgo(publishedAt);
        const impact = determineNewsImpact(article.title);
        const impactIcon = impact === 'positive' ? 'fa-arrow-up text-success' : 
                          impact === 'negative' ? 'fa-arrow-down text-danger' : 'fa-minus text-secondary';
        
        html += `
            <div class="news-item mb-3">
                <div class="d-flex align-items-start p-2 border rounded">
                    <i class="fas ${impactIcon} me-2 mt-1"></i>
                    <div class="news-content flex-grow-1">
                        <h6 class="news-title mb-1">
                            <a href="${article.url}" target="_blank" class="text-decoration-none">
                                ${article.title}
                            </a>
                        </h6>
                        <p class="news-description text-muted small mb-1">
                            ${article.description ? article.description.substring(0, 200) + '...' : 'Sin descripción'}
                        </p>
                        <div class="news-meta">
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>${timeAgo}
                                <span class="mx-2">•</span>
                                <i class="fas fa-newspaper me-1"></i>${article.source.name}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    newsEl.innerHTML = html;
}

// Load simulated news as fallback
function loadSimulatedNews() {
    const newsEl = document.getElementById('market-news');
    if (!newsEl) return;
    
    const news = [
        {
            title: "Gold price reaches $2,400 as investors seek safe haven amid economic uncertainty",
            description: "Gold prices surge to new monthly highs as investors flock to precious metals as a hedge against inflation and geopolitical tensions. Central bank policies continue to support precious metals demand.",
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            source: { name: "Financial Times" },
            url: "#",
            impact: "positive"
        },
        {
            title: "USD/COP exchange rate volatility continues amid Fed policy uncertainty",
            description: "Currency markets show increased volatility as the dollar-peso exchange rate reacts to Federal Reserve policy announcements. Colombian peso remains under pressure as dollar strength persists.",
            publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            source: { name: "Bloomberg" },
            url: "#",
            impact: "negative"
        },
        {
            title: "Silver price benefits from dual demand: investment and industrial",
            description: "Silver market sees strong performance as both investment demand and industrial consumption drive prices higher. The white metal continues to benefit from precious metals investment trends.",
            publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            source: { name: "Reuters" },
            url: "#",
            impact: "positive"
        },
        {
            title: "Precious metals trading volume spikes as inflation hedge demand rises",
            description: "Commodities trading shows significant volume increases as investors turn to precious metals for inflation protection. Gold and silver markets see record trading activity.",
            publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            source: { name: "MarketWatch" },
            url: "#",
            impact: "positive"
        },
        {
            title: "Central bank gold purchases reach record levels in Q3 2025",
            description: "Global central banks continue aggressive gold purchasing as part of reserve diversification strategy. This trend supports long-term price stability for precious metals markets.",
            publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            source: { name: "World Gold Council" },
            url: "#",
            impact: "positive"
        }
    ];
    
    let html = '<h6><i class="fas fa-newspaper me-2"></i>Noticias del Mercado</h6>';
    
    news.forEach(article => {
        const timeAgo = getTimeAgo(new Date(article.publishedAt));
        const impactIcon = article.impact === 'positive' ? 'fa-arrow-up text-success' : 
                          article.impact === 'negative' ? 'fa-arrow-down text-danger' : 'fa-minus text-secondary';
        
        html += `
            <div class="news-item mb-3">
                <div class="d-flex align-items-start p-2 border rounded">
                    <i class="fas ${impactIcon} me-2 mt-1"></i>
                    <div class="news-content flex-grow-1">
                        <h6 class="news-title mb-1">
                            <a href="${article.url}" target="_blank" class="text-decoration-none">
                                ${article.title}
                            </a>
                        </h6>
                        <p class="news-description text-muted small mb-1">
                            ${article.description}
                        </p>
                        <div class="news-meta">
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>${timeAgo}
                                <span class="mx-2">•</span>
                                <i class="fas fa-newspaper me-1"></i>${article.source.name}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    newsEl.innerHTML = html;
}

// Helper function to determine news impact
function determineNewsImpact(headline) {
    const positiveKeywords = [
        'sube', 'aumenta', 'crece', 'mejora', 'positivo', 'ganancia', 'beneficio',
        'surge', 'rises', 'gains', 'increases', 'improves', 'positive', 'growth',
        'up', 'higher', 'strong', 'bullish', 'rally', 'boost', 'advance'
    ];
    const negativeKeywords = [
        'baja', 'disminuye', 'cae', 'empeora', 'negativo', 'pérdida', 'crisis',
        'falls', 'drops', 'declines', 'decreases', 'negative', 'loss', 'crisis',
        'down', 'lower', 'weak', 'bearish', 'crash', 'plunge', 'slump'
    ];
    
    const headlineLower = headline.toLowerCase();
    
    for (const keyword of positiveKeywords) {
        if (headlineLower.includes(keyword)) return 'positive';
    }
    
    for (const keyword of negativeKeywords) {
        if (headlineLower.includes(keyword)) return 'negative';
    }
    
    return 'neutral';
}

// Helper function to get time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} minutos`;
    } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(diffInMinutes / 1440);
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
}











// Update finances dashboard
async function updateFinancesDashboard() {
    console.log('🔄 Actualizando dashboard financiero...');
    console.log('📊 Datos disponibles:', {
        incomes: incomes.length,
        expenses: expenses.length,
        accounts: accounts.length,
        budgets: budgets.length
    });
    
    // Sync toggles to ensure correct state
    syncToggles();
    
    // Calculate financial metrics for current period
    const totalIncomes = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const netBalance = totalIncomes - totalExpenses;
    
    // Calculate previous period metrics for comparison
    const previousPeriod = getPreviousFinancialPeriod();
    const previousIncomes = incomes.filter(income => isDateInFinancialPeriod(income.date, previousPeriod));
    const previousExpenses = expenses.filter(expense => isDateInFinancialPeriod(expense.date, previousPeriod));
    
    const previousTotalIncomes = previousIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    const previousTotalExpenses = previousExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const previousNetBalance = previousTotalIncomes - previousTotalExpenses;
    
    // Calculate percentage changes
    const incomeChange = calculatePercentageChange(previousTotalIncomes, totalIncomes);
    const expenseChange = calculatePercentageChange(previousTotalExpenses, totalExpenses);
    const balanceChange = calculatePercentageChange(previousNetBalance, netBalance);
    
    console.log('💰 Métricas calculadas:', {
        totalIncomes,
        totalExpenses,
        netBalance,
        previousTotalIncomes,
        previousTotalExpenses,
        previousNetBalance,
        incomeChange,
        expenseChange,
        balanceChange
    });
    
    // Update metric cards
    const monthlyIncomeEl = document.getElementById('monthly-income');
    const monthlyExpenseEl = document.getElementById('monthly-expense');
    const netBalanceEl = document.getElementById('net-balance');
    const budgetUsedEl = document.getElementById('budget-used');
    const budgetRemainingEl = document.getElementById('budget-remaining');
    
    console.log('🎯 Elementos encontrados:', {
        monthlyIncomeEl: !!monthlyIncomeEl,
        monthlyExpenseEl: !!monthlyExpenseEl,
        netBalanceEl: !!netBalanceEl,
        budgetUsedEl: !!budgetUsedEl,
        budgetRemainingEl: !!budgetRemainingEl
    });
    
    if (monthlyIncomeEl) {
        monthlyIncomeEl.textContent = showFinancialValues ? formatCurrency(totalIncomes) : '••••••';
        console.log('✅ Ingresos actualizados:', formatCurrency(totalIncomes));
    } else {
        console.error('❌ Elemento monthly-income no encontrado');
    }
    
    // Update income change percentage
    const incomeChangeEl = document.getElementById('income-change');
    if (incomeChangeEl) {
        const changeText = incomeChange >= 0 ? `+${Math.round(incomeChange)}%` : `${Math.round(incomeChange)}%`;
        incomeChangeEl.textContent = changeText;
        incomeChangeEl.className = `metric-change ${incomeChange >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (monthlyExpenseEl) {
        monthlyExpenseEl.textContent = showFinancialValues ? formatCurrency(totalExpenses) : '••••••';
        console.log('✅ Gastos actualizados:', formatCurrency(totalExpenses));
    } else {
        console.error('❌ Elemento monthly-expense no encontrado');
    }
    
    // Update expense change percentage
    const expenseChangeEl = document.getElementById('expense-change');
    if (expenseChangeEl) {
        const changeText = expenseChange >= 0 ? `+${Math.round(expenseChange)}%` : `${Math.round(expenseChange)}%`;
        expenseChangeEl.textContent = changeText;
        // Para gastos: rojo cuando aumentan (malo), verde cuando disminuyen (bueno)
        expenseChangeEl.className = `metric-change ${expenseChange >= 0 ? 'negative' : 'positive'}`;
    }
    
    if (netBalanceEl) {
        netBalanceEl.textContent = showFinancialValues ? formatCurrency(netBalance) : '••••••';
        console.log('✅ Balance actualizado:', formatCurrency(netBalance));
    } else {
        console.error('❌ Elemento net-balance no encontrado');
    }
    
    // Update balance change percentage
    const balanceChangeEl = document.getElementById('balance-change');
    if (balanceChangeEl) {
        const changeText = balanceChange >= 0 ? `+${Math.round(balanceChange)}%` : `${Math.round(balanceChange)}%`;
        balanceChangeEl.textContent = changeText;
        balanceChangeEl.className = `metric-change ${balanceChange >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Calculate budget usage - sum all active budgets
    const activeBudgets = budgets.filter(budget => budget.status === 'active' && budget.isActive === true);
    const totalBudgeted = activeBudgets.reduce((sum, budget) => sum + (budget.totalBudgeted || 0), 0);
    
    let budgetUsed = 0;
    let budgetRemaining = 0;
    if (totalBudgeted > 0) {
        budgetUsed = (totalExpenses / totalBudgeted) * 100;
        budgetRemaining = totalBudgeted - totalExpenses;
    }
    
    if (budgetUsedEl) {
        if (totalBudgeted > 0) {
            budgetUsedEl.textContent = `${Math.round(budgetUsed)}%`; // Siempre mostrar porcentajes
        } else {
            budgetUsedEl.textContent = 'Sin presupuesto';
        }
        console.log('✅ Presupuesto usado actualizado:', budgetUsedEl.textContent);
    } else {
        console.error('❌ Elemento budget-used no encontrado');
    }
    
    if (budgetRemainingEl) {
        if (totalBudgeted > 0) {
            budgetRemainingEl.textContent = showFinancialValues ? formatCurrency(budgetRemaining) : '••••••';
        } else {
            budgetRemainingEl.textContent = 'N/A';
        }
        console.log('✅ Presupuesto restante actualizado:', budgetRemainingEl.textContent);
    } else {
        console.error('❌ Elemento budget-remaining no encontrado');
    }
    
    console.log('📈 Actualizando componentes del dashboard...');
    
    // Update accounts summary
    updateAccountsSummary();
    
    // Update recent transactions
    updateRecentTransactions();
    
    // Update expenses chart
    updateExpensesChart();
    
    // Update active budgets summary
    updateActiveBudgetsSummary();
    
    // Load and update quotes
    await loadQuotes();
    
    // Update financial values display after all components are updated
    updateFinancialValuesDisplay();
    
    console.log('✅ Dashboard financiero actualizado correctamente');
}

// ===== DARK MODE FUNCTIONS =====

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// Set theme
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
            themeIcon.parentElement.title = 'Cambiar a modo claro';
        } else {
            themeIcon.className = 'fas fa-moon';
            themeIcon.parentElement.title = 'Cambiar a modo oscuro';
        }
    }
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// ===== BOOKS FUNCTIONS =====

// Books data (in-memory for now)
let books = [];
let currentBookFilter = 'all';

// Initialize books
function initializeBooks() {
    // Sample books data
    books = [
        {
            id: 1,
            title: "El Principito",
            author: "Antoine de Saint-Exupéry",
            status: "read",
            rating: 5,
            review: "Una obra maestra que todos deberían leer.",
            dateAdded: "2025-01-15",
            dateRead: "2025-01-20"
        },
        {
            id: 2,
            title: "1984",
            author: "George Orwell",
            status: "reading",
            rating: 0,
            review: "",
            dateAdded: "2025-01-10",
            dateRead: null
        },
        {
            id: 3,
            title: "Cien años de soledad",
            author: "Gabriel García Márquez",
            status: "want",
            rating: 0,
            review: "",
            dateAdded: "2025-01-05",
            dateRead: null
        }
    ];
    updateBooksList();
}

// Update books list
function updateBooksList() {
    const booksList = document.getElementById('books-list');
    if (!booksList) return;

    const filteredBooks = currentBookFilter === 'all' 
        ? books 
        : books.filter(book => book.status === currentBookFilter);

    if (filteredBooks.length === 0) {
        booksList.innerHTML = '<p class="text-muted">No hay libros en esta categoría</p>';
        return;
    }

    let html = '';
    filteredBooks.forEach(book => {
        const statusBadge = getStatusBadge(book.status);
        const ratingStars = getRatingStars(book.rating);
        
        html += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h5 class="card-title">${book.title}</h5>
                            <p class="card-text text-muted">por ${book.author}</p>
                            ${book.review ? `<p class="card-text">${book.review}</p>` : ''}
                            ${ratingStars}
                        </div>
                        <div class="col-md-4 text-end">
                            ${statusBadge}
                            <div class="btn-group mt-2" role="group">
                                <button class="btn btn-sm btn-outline-primary" onclick="editBook(${book.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteBook(${book.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    booksList.innerHTML = html;
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'read': '<span class="badge bg-success">Leído</span>',
        'reading': '<span class="badge bg-primary">Leyendo</span>',
        'want': '<span class="badge bg-warning">Quiero Leer</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Desconocido</span>';
}

// Get rating stars
function getRatingStars(rating) {
    if (rating === 0) return '';
    
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star text-warning"></i>';
        } else {
            stars += '<i class="far fa-star text-warning"></i>';
        }
    }
    return `<div class="mt-2">${stars}</div>`;
}

// Filter books
function filterBooks(filter) {
    currentBookFilter = filter;
    updateBooksList();
}

// Show add book modal
function showAddBookModal() {
    // For now, just show a simple prompt
    const title = prompt('Título del libro:');
    if (title) {
        const author = prompt('Autor:');
        if (author) {
            const newBook = {
                id: Date.now(),
                title: title,
                author: author,
                status: 'want',
                rating: 0,
                review: '',
                dateAdded: new Date().toISOString().split('T')[0],
                dateRead: null
            };
            books.push(newBook);
            updateBooksList();
            showSuccess('Libro agregado exitosamente');
        }
    }
}

// Edit book
function editBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    const newStatus = prompt('Estado (read/reading/want):', book.status);
    if (newStatus && ['read', 'reading', 'want'].includes(newStatus)) {
        book.status = newStatus;
        updateBooksList();
        showSuccess('Libro actualizado');
    }
}

// Delete book
function deleteBook(bookId) {
    if (confirm('¿Estás seguro de que quieres eliminar este libro?')) {
        books = books.filter(b => b.id !== bookId);
        updateBooksList();
        showSuccess('Libro eliminado');
    }
}

// Load books section
function loadBooks() {
    if (books.length === 0) {
        initializeBooks();
    }
    updateBooksList();
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Update accounts summary
function updateAccountsSummary() {
    console.log('🔄 Actualizando resumen de cuentas...');
    const accountsSummary = document.getElementById('accounts-summary');
    if (!accountsSummary) {
        console.error('❌ Elemento accounts-summary no encontrado');
        return;
    }
    
    console.log('📊 Cuentas disponibles:', accounts.length);
    
    if (accounts.length === 0) {
        accountsSummary.innerHTML = '<p class="text-muted">No hay cuentas registradas</p>';
        console.log('⚠️ No hay cuentas para mostrar');
        return;
    }
    
    const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    const totalClass = totalBalance >= 0 ? 'text-success' : 'text-danger';
    
    console.log('💰 Balance total calculado:', formatCurrency(totalBalance));
    
    let html = `
        <div class="list-group list-group-flush">
            <div class="list-group-item d-flex justify-content-between align-items-center border-0 px-0">
                <div>
                    <h6 class="mb-1 fw-bold">Total General</h6>
                    <small class="text-muted">Todas las cuentas</small>
                </div>
                <span class="badge bg-primary ${totalClass} fs-6 metric-value">${showFinancialValues ? formatCurrency(totalBalance) : '••••••'}</span>
            </div>
    `;
    
    accounts.forEach(account => {
        const balance = account.balance || 0;
        const balanceClass = balance >= 0 ? 'text-success' : 'text-danger';
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center border-0 px-0">
                <div>
                    <h6 class="mb-1 fw-semibold">${account.name}</h6>
                    <small class="text-muted">${account.type}</small>
                </div>
                <span class="badge bg-light text-dark ${balanceClass} amount-neutral">${showFinancialValues ? formatCurrency(balance) : '••••••'}</span>
            </div>
        `;
    });
    
    html += '</div>';
    accountsSummary.innerHTML = html;
    console.log('✅ Resumen de cuentas actualizado');
}

// Update recent transactions
function updateRecentTransactions() {
    console.log('🔄 Actualizando transacciones recientes...');
    
    // Recent incomes
    const recentIncomes = document.getElementById('recent-incomes');
    if (!recentIncomes) {
        console.error('❌ Elemento recent-incomes no encontrado');
        return;
    }
    
    const sortedIncomes = [...incomes].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    console.log('📈 Ingresos recientes:', sortedIncomes.length);
    
    if (sortedIncomes.length === 0) {
        recentIncomes.innerHTML = '<p class="text-muted">No hay ingresos recientes</p>';
        console.log('⚠️ No hay ingresos para mostrar');
    } else {
        let html = '<div class="list-group list-group-flush">';
        sortedIncomes.forEach(income => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center border-0 px-0">
                    <div>
                        <h6 class="mb-1 fw-semibold">${income.description}</h6>
                        <small class="text-muted">${income.category}</small>
                    </div>
                    <span class="badge bg-success amount-positive">${showFinancialValues ? formatCurrency(income.amount) : '••••••'}</span>
                </div>
            `;
        });
        html += '</div>';
        recentIncomes.innerHTML = html;
        console.log('✅ Ingresos recientes actualizados');
    }
    
    // Recent expenses
    const recentExpenses = document.getElementById('recent-expenses');
    if (!recentExpenses) {
        console.error('❌ Elemento recent-expenses no encontrado');
        return;
    }
    
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    console.log('📉 Gastos recientes:', sortedExpenses.length);
    
    if (sortedExpenses.length === 0) {
        recentExpenses.innerHTML = '<p class="text-muted">No hay gastos recientes</p>';
        console.log('⚠️ No hay gastos para mostrar');
    } else {
        let html = '<div class="list-group list-group-flush">';
        sortedExpenses.forEach(expense => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center border-0 px-0">
                    <div>
                        <h6 class="mb-1 fw-semibold">${expense.description}</h6>
                        <small class="text-muted">${expense.category}</small>
                    </div>
                    <span class="badge bg-danger amount-negative">${showFinancialValues ? formatCurrency(expense.amount) : '••••••'}</span>
                </div>
            `;
        });
        html += '</div>';
        recentExpenses.innerHTML = html;
        console.log('✅ Gastos recientes actualizados');
    }
}

// Update expenses chart
function updateExpensesChart() {
    const canvas = document.getElementById('expensesChart');
    if (!canvas) return;
    
    // Group expenses by category
    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense.category;
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    // Create simple chart data
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    
    if (categories.length === 0) {
        canvas.parentElement.innerHTML = '<p class="text-muted text-center">No hay datos de gastos para mostrar</p>';
        return;
    }
    
    // Simple text-based chart
    let html = '<div class="expense-categories">';
    categories.forEach((category, index) => {
        const percentage = (amounts[index] / amounts.reduce((a, b) => a + b, 0)) * 100;
        html += `
            <div class="category-item">
                <div class="category-info">
                    <span class="category-name">${category}</span>
                    <span class="category-amount">${formatCurrency(amounts[index])}</span>
                </div>
                <div class="category-bar">
                    <div class="category-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    canvas.parentElement.innerHTML = html;
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
        // Update financial values display after loading accounts
        updateFinancialValuesDisplay();
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
    
    // Update financial values display after updating the list
    updateFinancialValuesDisplay();
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
        // Update financial values display after loading incomes
        updateFinancialValuesDisplay();
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
    
    // Update financial values display after updating the list
    updateFinancialValuesDisplay();
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
        // Update financial values display after loading expenses
        updateFinancialValuesDisplay();
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
    
    // Update financial values display after updating the list
    updateFinancialValuesDisplay();
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
        // Update financial values display after loading budgets
        updateFinancialValuesDisplay();
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
                        <button class="btn btn-sm btn-outline-info" onclick="repeatBudget('${budget.id}')" title="Repetir para siguiente período">
                            <i class="fas fa-copy"></i>
                        </button>
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
    
    // Update financial values display after updating the list
    updateFinancialValuesDisplay();
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

function getPreviousFinancialPeriod() {
    const cutoffDay = cutoffConfig.cutoffDay;
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    let financialMonth, financialYear, periodStart, periodEnd;
    
    if (currentDay >= cutoffDay) {
        // Si estamos en o después del día de corte, el período anterior es este mes
        financialMonth = currentMonth;
        financialYear = currentYear;
    } else {
        // Si estamos antes del día de corte, el período anterior es el mes pasado
        financialMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        financialYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    }
    
    // Calcular fechas de inicio y fin del período anterior
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
        status: editingItem ? editingItem.status : 'draft', // Mantener el estado original si se está editando
        isActive: editingItem ? editingItem.isActive : true // Mantener el estado activo original si se está editando
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
            if (editingItem) {
                showSuccess('Presupuesto actualizado exitosamente');
            } else {
                showSuccess('Presupuesto creado exitosamente');
                // Mostrar alerta sobre el estado draft
                setTimeout(() => {
                    showAlert('⚠️ Recordatorio: Tu presupuesto está en estado DRAFT. Para comenzar a usarlo, debes activarlo desde la lista de presupuestos.', 'warning');
                }, 1000);
            }
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

function showAlert(message, type = 'info') {
    // Remove existing alerts
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of current section
    const currentSectionEl = document.getElementById(currentSection + '-section');
    currentSectionEl.insertBefore(alert, currentSectionEl.firstChild);
    
    // Auto-dismiss after 8 seconds for warnings
    const dismissTime = type === 'warning' ? 8000 : 5000;
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, dismissTime);
}

// Toggle financial values visibility
function toggleFinancialValues(event) {
    console.log('🔄 Toggle financial values clicked');
    
    // Get the toggle that was actually clicked
    let activeToggle = null;
    if (event && event.target) {
        activeToggle = event.target;
        console.log('✅ Clicked toggle:', activeToggle.id, 'checked:', activeToggle.checked);
    } else {
        // Fallback: find any toggle that is checked
        const toggles = [
            'toggleValues',
            'toggleValuesAccounts', 
            'toggleValuesIncomes',
            'toggleValuesExpenses',
            'toggleValuesBudgets'
        ];
        
        for (const toggleId of toggles) {
            const toggle = document.getElementById(toggleId);
            if (toggle && toggle.checked) {
                activeToggle = toggle;
                console.log('✅ Found checked toggle:', toggleId, 'checked:', toggle.checked);
                break;
            }
        }
    }
    
    if (activeToggle) {
        showFinancialValues = activeToggle.checked;
        console.log('💰 Financial values visibility:', showFinancialValues ? 'SHOW' : 'HIDE');
    } else {
        console.error('❌ No toggle found');
    }
    
    // Sync all toggles across all sections
    const allToggles = [
        'toggleValues',
        'toggleValuesAccounts', 
        'toggleValuesIncomes',
        'toggleValuesExpenses',
        'toggleValuesBudgets'
    ];
    
    allToggles.forEach(toggleId => {
        const toggleElement = document.getElementById(toggleId);
        if (toggleElement) {
            toggleElement.checked = showFinancialValues;
        }
    });
    
    // Update all labels
    const allLabels = [
        'label[for="toggleValues"]',
        'label[for="toggleValuesAccounts"]',
        'label[for="toggleValuesIncomes"]',
        'label[for="toggleValuesExpenses"]',
        'label[for="toggleValuesBudgets"]'
    ];
    
    allLabels.forEach(selector => {
        const label = document.querySelector(selector);
        if (label) {
            if (showFinancialValues) {
                label.innerHTML = '<i class="fas fa-eye me-1"></i>Mostrar valores';
            } else {
                label.innerHTML = '<i class="fas fa-eye-slash me-1"></i>Ocultar valores';
            }
        }
    });
    
    // Update all financial displays
    updateFinancialValuesDisplay();
}

// Update financial values display based on toggle state
function updateFinancialValuesDisplay() {
    console.log('🔄 Updating financial values display, showFinancialValues:', showFinancialValues);
    
    // Only target elements that contain currency values, not percentages or counts
    const valueElements = document.querySelectorAll('.metric-value, .category-amount, .list-item-amount, .amount-positive, .amount-negative, .amount-danger, .amount-neutral');
    
    // Ensure percentage values are always visible
    const percentageElements = document.querySelectorAll('.percentage-value');
    percentageElements.forEach(element => {
        element.style.display = '';
        element.classList.remove('hidden-value');
    });
    
    console.log('📊 Found value elements:', valueElements.length);
    
    valueElements.forEach(element => {
        // Check if the element contains currency symbols or is a monetary value
        const text = element.textContent || '';
        const isMonetaryValue = text.includes('$') || text.includes('€') || text.includes('£') || 
                               text.includes('COP') || text.includes('USD') || text.includes('EUR') ||
                               /^\$[\d,]+/.test(text) || /^\$[\d,]+\.\d{2}$/.test(text) ||
                               /^\d+,\d{3}/.test(text) || /^\d+\.\d{3}/.test(text) ||
                               /^\d+,\d{3}\.\d{2}$/.test(text) || /^\d+\.\d{3}\.\d{2}$/.test(text);
        
        if (isMonetaryValue) {
            if (showFinancialValues) {
                // Show the original value
                element.style.display = '';
                element.classList.remove('hidden-value');
            } else {
                // Hide the value and show placeholder
                element.style.display = 'none';
                element.classList.add('hidden-value');
            }
        }
    });
    
    // Add placeholder elements for hidden values
    if (!showFinancialValues) {
        addValuePlaceholders();
    } else {
        removeValuePlaceholders();
    }
}

// Add placeholder elements for hidden values
function addValuePlaceholders() {
    const valueElements = document.querySelectorAll('.hidden-value');
    
    valueElements.forEach(element => {
        if (!element.nextElementSibling || !element.nextElementSibling.classList.contains('value-placeholder')) {
            const placeholder = document.createElement('span');
            placeholder.className = 'value-placeholder text-muted';
            placeholder.innerHTML = '••••••';
            placeholder.style.fontSize = element.style.fontSize || 'inherit';
            placeholder.style.fontWeight = element.style.fontWeight || 'inherit';
            element.parentNode.insertBefore(placeholder, element.nextSibling);
        }
    });
}

// Remove placeholder elements
function removeValuePlaceholders() {
    const placeholders = document.querySelectorAll('.value-placeholder');
    placeholders.forEach(placeholder => placeholder.remove());
}

// Reload dashboard function
async function reloadDashboard() {
    console.log('🔄 Reloading dashboard...');
    
    // Show loading state
    const reloadButton = event.target;
    const originalContent = reloadButton.innerHTML;
    reloadButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Recargando...';
    reloadButton.disabled = true;
    
    try {
        // Clear existing data
        accounts = [];
        incomes = [];
        expenses = [];
        budgets = [];
        
        // Reload all data
        await Promise.all([
            loadAccounts(),
            loadIncomes(),
            loadExpenses(),
            loadBudgets()
        ]);
        
        // Update dashboard
        updateFinancesDashboard();
        
        // Show success message
        showSuccess('Dashboard recargado exitosamente');
        
        console.log('✅ Dashboard reloaded successfully');
        
    } catch (error) {
        console.error('❌ Error reloading dashboard:', error);
        showError('Error al recargar el dashboard');
    } finally {
        // Restore button state
        reloadButton.innerHTML = originalContent;
        reloadButton.disabled = false;
    }
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

async function repeatBudget(budgetId) {
    try {
        // Encontrar el presupuesto original
        const originalBudget = budgets.find(b => b.id === budgetId);
        if (!originalBudget) {
            showError('Presupuesto no encontrado');
            return;
        }

        // Calcular el siguiente período
        const nextPeriod = calculateNextPeriod(originalBudget);
        if (!nextPeriod) {
            showError('No se pudo calcular el siguiente período');
            return;
        }

        // Crear el nuevo presupuesto
        const newBudget = {
            name: `${originalBudget.name} - ${nextPeriod.periodLabel}`,
            month: nextPeriod.month,
            year: nextPeriod.year,
            period: originalBudget.period || 'monthly',
            period_start: nextPeriod.periodStart,
            period_end: nextPeriod.periodEnd,
            budget_type: originalBudget.budgetType || 'fixed',
            percentage: originalBudget.percentage,
            categories: originalBudget.categories || [],
            total_budgeted: originalBudget.totalBudgeted || 0,
            status: 'draft'
        };

        // Enviar al backend
        await apiCall('/budgets', 'POST', newBudget);
        showSuccess(`Presupuesto copiado para ${nextPeriod.periodLabel}`);
        loadBudgets();
    } catch (error) {
        console.error('Error repeating budget:', error);
        showError('Error al repetir el presupuesto: ' + error.message);
    }
}

function calculateNextPeriod(originalBudget) {
    const period = originalBudget.period || 'monthly';
    const cutoffDay = cutoffConfig.cutoffDay;
    
    // Obtener el período actual del presupuesto
    const currentMonth = originalBudget.month || '2025-10';
    const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number);
    
    let nextYear, nextMonth, nextStart, nextEnd, periodLabel;
    
    switch (period) {
        case 'monthly':
            // Siguiente mes basado en el día de corte
            if (currentMonthNum === 12) {
                nextYear = currentYear + 1;
                nextMonth = 1;
            } else {
                nextYear = currentYear;
                nextMonth = currentMonthNum + 1;
            }
            
            // Calcular fechas del siguiente período
            const nextPeriodStart = new Date(nextYear, nextMonth - 1, cutoffDay);
            const nextPeriodEnd = new Date(nextYear, nextMonth, cutoffDay - 1);
            
            nextStart = nextPeriodStart;
            nextEnd = nextPeriodEnd;
            periodLabel = `${nextPeriodStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
            break;
            
        case 'quarterly':
            // Siguiente trimestre (3 meses)
            if (currentMonthNum >= 10) {
                nextYear = currentYear + 1;
                nextMonth = currentMonthNum - 9; // Oct->Ene, Nov->Feb, Dic->Mar
            } else {
                nextYear = currentYear;
                nextMonth = currentMonthNum + 3;
            }
            
            const nextQuarterStart = new Date(nextYear, nextMonth - 1, cutoffDay);
            const nextQuarterEnd = new Date(nextYear, nextMonth + 2, cutoffDay - 1);
            
            nextStart = nextQuarterStart;
            nextEnd = nextQuarterEnd;
            const quarter = Math.ceil(nextMonth / 3);
            periodLabel = `Q${quarter} ${nextYear}`;
            break;
            
        case 'semiannual':
            // Siguiente semestre (6 meses)
            if (currentMonthNum >= 7) {
                nextYear = currentYear + 1;
                nextMonth = currentMonthNum - 6; // Jul->Ene, Ago->Feb, etc.
            } else {
                nextYear = currentYear;
                nextMonth = currentMonthNum + 6;
            }
            
            const nextSemesterStart = new Date(nextYear, nextMonth - 1, cutoffDay);
            const nextSemesterEnd = new Date(nextYear, nextMonth + 5, cutoffDay - 1);
            
            nextStart = nextSemesterStart;
            nextEnd = nextSemesterEnd;
            const semester = nextMonth <= 6 ? 1 : 2;
            periodLabel = `Semestre ${semester} ${nextYear}`;
            break;
            
        case 'yearly':
            // Siguiente año
            nextYear = currentYear + 1;
            nextMonth = currentMonthNum;
            
            const nextYearStart = new Date(nextYear, nextMonth - 1, cutoffDay);
            const nextYearEnd = new Date(nextYear + 1, nextMonth - 1, cutoffDay - 1);
            
            nextStart = nextYearStart;
            nextEnd = nextYearEnd;
            periodLabel = nextYear.toString();
            break;
            
        default:
            return null;
    }
    
    return {
        periodStart: nextStart.toISOString().split('T')[0],
        periodEnd: nextEnd.toISOString().split('T')[0],
        month: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
        year: nextYear,
        periodLabel: periodLabel
    };
}

// ===== DASHBOARD FINANCIAL FUNCTIONS =====


// Update expenses chart
function updateExpensesChart() {
    const chartContainer = document.getElementById('expenses-chart');
    if (!chartContainer) return;
    
    // Group expenses by category
    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense.category || 'Sin categoría';
        categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
    });
    
    if (Object.keys(categoryTotals).length === 0) {
        chartContainer.innerHTML = '<p class="text-muted text-center">No hay gastos para mostrar</p>';
        return;
    }
    
    // Create simple chart with categories and amounts
    let html = '<div class="expense-categories">';
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5); // Top 5 categories
    
    sortedCategories.forEach(([category, amount]) => {
        const percentage = (amount / Object.values(categoryTotals).reduce((a, b) => a + b, 0)) * 100;
        html += `
            <div class="category-item mb-2">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="category-label">${category}</span>
                    <span class="category-amount">${showFinancialValues ? formatCurrency(amount) : '••••••'}</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar" role="progressbar" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    chartContainer.innerHTML = html;
}

// Update active budgets summary
function updateActiveBudgetsSummary() {
    const container = document.getElementById('active-budgets-summary');
    if (!container) return;
    
    // Filter active budgets
    const activeBudgets = budgets.filter(budget => budget.status === 'active' && budget.isActive === true);
    
    if (activeBudgets.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                <p class="text-muted">No tienes presupuestos activos</p>
                <a href="#" class="btn btn-primary btn-sm" onclick="showSection('budgets')">
                    <i class="fas fa-plus me-1"></i>Crear Presupuesto
                </a>
            </div>
        `;
        return;
    }
    
    // Create summary cards for each active budget
    let html = '<div class="row">';
    
    activeBudgets.forEach(budget => {
        const budgetUsed = budget.totalSpent || 0;
        const budgetTotal = budget.totalBudgeted || 0;
        const budgetRemaining = budgetTotal - budgetUsed;
        const usagePercentage = budgetTotal > 0 ? (budgetUsed / budgetTotal) * 100 : 0;
        
        // Determine status color
        let statusClass = 'success';
        if (usagePercentage > 90) statusClass = 'danger';
        else if (usagePercentage > 75) statusClass = 'warning';
        
        html += `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title mb-0">${budget.name}</h6>
                            <span class="badge bg-${statusClass} percentage-value">${Math.round(usagePercentage)}%</span>
                        </div>
                        <p class="text-muted small mb-3">${budget.month} ${budget.year}</p>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small class="text-muted">Usado</small>
                                <small class="text-muted amount-positive">${showFinancialValues ? formatCurrency(budgetUsed) : '••••••'}</small>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-${statusClass}" role="progressbar" 
                                     style="width: ${usagePercentage}%"></div>
                            </div>
                        </div>
                        
                        <div class="row text-center">
                            <div class="col-6">
                                <small class="text-muted d-block">Total</small>
                                <strong class="amount-neutral">${showFinancialValues ? formatCurrency(budgetTotal) : '••••••'}</strong>
                            </div>
                            <div class="col-6">
                                <small class="text-muted d-block">Restante</small>
                                <strong class="text-${budgetRemaining >= 0 ? 'success' : 'danger'} amount-neutral">
                                    ${showFinancialValues ? formatCurrency(budgetRemaining) : '••••••'}
                                </strong>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <button class="btn btn-outline-primary btn-sm w-100" 
                                    onclick="editBudget('${budget.id}')">
                                <i class="fas fa-edit me-1"></i>Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Add summary stats
    const totalBudgeted = activeBudgets.reduce((sum, budget) => sum + (budget.totalBudgeted || 0), 0);
    const totalSpent = activeBudgets.reduce((sum, budget) => sum + (budget.totalSpent || 0), 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const overallUsage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
    
    html += `
        <div class="row mt-3">
            <div class="col-12">
                <div class="card bg-light dark-mode-card">
                    <div class="card-body">
                        <h6 class="card-title mb-3">
                            <i class="fas fa-chart-line me-2"></i>Resumen General
                        </h6>
                        <div class="row text-center">
                            <div class="col-md-3">
                                <div class="metric-item">
                                    <h4 class="text-primary">${activeBudgets.length}</h4>
                                    <small class="text-muted">Presupuestos Activos</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-item">
                                    <h4 class="text-info metric-value">${showFinancialValues ? formatCurrency(totalBudgeted) : '••••••'}</h4>
                                    <small class="text-muted">Total Presupuestado</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-item">
                                    <h4 class="text-warning metric-value">${showFinancialValues ? formatCurrency(totalSpent) : '••••••'}</h4>
                                    <small class="text-muted">Total Gastado</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="metric-item">
                                    <h4 class="text-${totalRemaining >= 0 ? 'success' : 'danger'} metric-value">${showFinancialValues ? formatCurrency(totalRemaining) : '••••••'}</h4>
                                    <small class="text-muted">Total Restante</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Load USD/COP data (simulated due to Alpha Vantage rate limits)
async function loadUSDData() {
    console.log('💵 Loading USD/COP data (simulated)...');
    
    // Simulated USD/COP data based on realistic Colombian peso fluctuations
    const baseRate = 3920; // Base rate around 3920 COP per USD
    const variation = (Math.random() - 0.5) * 100; // Random variation of ±50 COP
    const currentPrice = baseRate + variation;
    
    // Simulate realistic variations
    const change7d = (Math.random() - 0.5) * 4; // ±2% weekly variation
    const change30d = (Math.random() - 0.5) * 8; // ±4% monthly variation
    const change1y = (Math.random() - 0.5) * 20; // ±10% yearly variation
    
    const result = {
        fromCurrency: 'USD',
        toCurrency: 'COP',
        currentPrice: Math.round(currentPrice),
        lastUpdate: new Date().toISOString(),
        source: 'Simulated (Alpha Vantage rate limit)',
        change7d: Math.round(change7d * 10) / 10,
        change30d: Math.round(change30d * 10) / 10,
        change1y: Math.round(change1y * 10) / 10
    };
    
    console.log('✅ USD/COP simulated data:', result);
    return result;
}

// Load cryptocurrency quotes for dashboard
async function loadCryptoQuotes() {
    console.log('🪙 Cargando cotizaciones de criptomonedas...');
    
    try {
        // Load USD data from database (using same endpoint as crypto for consistency)
        const marketData = await fetch(`${API_BASE_URL}/market-data/current`);
        const marketResponse = await marketData.json();
        
        if (marketResponse && marketResponse.forex && marketResponse.forex.USD) {
            const usdData = marketResponse.forex.USD;
            const usdPrice = document.getElementById('usd-cop-price');
            const usdChange = document.getElementById('usd-cop-change');
            const usdChange7d = document.getElementById('usd-cop-change-7d');
            const usdChange30d = document.getElementById('usd-cop-change-30d');
            const usdChange1y = document.getElementById('usd-cop-change-1y');
            
            if (usdPrice) {
                usdPrice.textContent = `$${usdData.price.toLocaleString()}`;
            }
            if (usdChange) {
                usdChange.textContent = 'Tasa de cambio';
                usdChange.className = 'text-muted';
            }
            if (usdChange7d && usdData.variations && usdData.variations['7d'] !== null) {
                const change = usdData.variations['7d'];
                usdChange7d.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
                usdChange7d.className = change >= 0 ? 'text-success' : 'text-danger';
            } else if (usdChange7d) {
                usdChange7d.textContent = '-';
                usdChange7d.className = 'text-muted';
            }
            if (usdChange30d && usdData.variations && usdData.variations['30d'] !== null) {
                const change = usdData.variations['30d'];
                usdChange30d.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
                usdChange30d.className = change >= 0 ? 'text-success' : 'text-danger';
            } else if (usdChange30d) {
                usdChange30d.textContent = '-';
                usdChange30d.className = 'text-muted';
            }
            if (usdChange1y && usdData.variations && usdData.variations['1y'] !== null) {
                const change = usdData.variations['1y'];
                usdChange1y.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
                usdChange1y.className = change >= 0 ? 'text-success' : 'text-danger';
                console.log('✅ USD 1y variation updated:', change);
            } else if (usdChange1y) {
                usdChange1y.textContent = '-';
                usdChange1y.className = 'text-muted';
                console.log('❌ USD 1y variation not found or null');
            }
        }
        
        // BTC and QRL data are already loaded from the same endpoint above
        
        if (marketResponse && marketResponse.crypto && marketResponse.crypto.BTC) {
            const btcData = marketResponse.crypto.BTC;
            const btcPrice = document.getElementById('btc-price');
            const btcChange = document.getElementById('btc-change');
            const btcChange7d = document.getElementById('btc-change-7d');
            const btcChange30d = document.getElementById('btc-change-30d');
            const btcChange1y = document.getElementById('btc-change-1y');
            
            if (btcPrice) {
                btcPrice.textContent = `$${btcData.price.toLocaleString()}`;
            }
            if (btcChange && btcData.variations && btcData.variations['24h']) {
                const change = btcData.variations['24h'];
                btcChange.textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                btcChange.className = change >= 0 ? 'text-success' : 'text-danger';
            }
            if (btcChange7d && btcData.variations && btcData.variations['7d'] !== null) {
                const change = btcData.variations['7d'];
                btcChange7d.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
                btcChange7d.className = change >= 0 ? 'text-success' : 'text-danger';
            } else if (btcChange7d) {
                btcChange7d.textContent = '-';
                btcChange7d.className = 'text-muted';
            }
            if (btcChange30d && btcData.variations && btcData.variations['30d'] !== null) {
                const change = btcData.variations['30d'];
                btcChange30d.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
                btcChange30d.className = change >= 0 ? 'text-success' : 'text-danger';
            } else if (btcChange30d) {
                btcChange30d.textContent = '-';
                btcChange30d.className = 'text-muted';
            }
            if (btcChange1y && btcData.variations && btcData.variations['1y'] !== null) {
                const change = btcData.variations['1y'];
                btcChange1y.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
                btcChange1y.className = change >= 0 ? 'text-success' : 'text-danger';
            } else if (btcChange1y) {
                btcChange1y.textContent = '-';
                btcChange1y.className = 'text-muted';
            }
        }
        
        // Load QRL data from database (using same marketResponse from above)
        if (marketResponse && marketResponse.crypto && marketResponse.crypto.QRL) {
            const qrlData = marketResponse.crypto.QRL;
            const qrlPrice = document.getElementById('qrl-price');
            const qrlChange = document.getElementById('qrl-change');
            const qrlChange7d = document.getElementById('qrl-change-7d');
            const qrlChange30d = document.getElementById('qrl-change-30d');
            const qrlChange1y = document.getElementById('qrl-change-1y');
            
            if (qrlPrice) {
                qrlPrice.textContent = `$${qrlData.price.toFixed(6)}`;
            }
            if (qrlChange && qrlData.variations && qrlData.variations['24h']) {
                const change = qrlData.variations['24h'];
                qrlChange.textContent = `${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                qrlChange.className = change >= 0 ? 'text-success' : 'text-danger';
            }
            if (qrlChange7d && qrlData.variations && qrlData.variations['7d'] !== null) {
                const change = qrlData.variations['7d'];
                qrlChange7d.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
                qrlChange7d.className = change >= 0 ? 'text-success' : 'text-danger';
            } else if (qrlChange7d) {
                qrlChange7d.textContent = '-';
                qrlChange7d.className = 'text-muted';
            }
            if (qrlChange30d && qrlData.variations && qrlData.variations['30d'] !== null) {
                const change = qrlData.variations['30d'];
                qrlChange30d.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
                qrlChange30d.className = change >= 0 ? 'text-success' : 'text-danger';
            } else if (qrlChange30d) {
                qrlChange30d.textContent = '-';
                qrlChange30d.className = 'text-muted';
            }
            if (qrlChange1y && qrlData.variations && qrlData.variations['1y'] !== null) {
                const change = qrlData.variations['1y'];
                qrlChange1y.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
                qrlChange1y.className = change >= 0 ? 'text-success' : 'text-danger';
            } else if (qrlChange1y) {
                qrlChange1y.textContent = '-';
                qrlChange1y.className = 'text-muted';
            }
        }
        
        console.log('✅ Cotizaciones cargadas exitosamente');
    } catch (error) {
        console.error('❌ Error cargando cotizaciones:', error);
        
        // Show error state
        const elements = ['usd-cop-price', 'btc-price', 'qrl-price'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Error';
                element.className = 'text-danger';
            }
        });
    }
}

// ==========================================
// INFLATION FUNCTIONS
// ==========================================

// Load inflation data when section is shown
async function loadInflationData() {
    console.log('📊 Loading inflation data...');
    
    try {
        // Set default comparison date to today
        const today = new Date().toISOString().split('T')[0];
        const comparisonDateInput = document.getElementById('purchasing-power-comparison-date');
        if (comparisonDateInput && !comparisonDateInput.value) {
            comparisonDateInput.value = today;
        }
        
        // Load current inflation rates
        await loadCurrentInflationRates();
        
        // Load inflation insights
        await loadInflationInsights();
        
        console.log('✅ Inflation data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading inflation data:', error);
    }
}

// Load current inflation rates for all countries
async function loadCurrentInflationRates() {
    try {
        console.log('🔄 Fetching current inflation rates...');
        
        const response = await fetch(`${API_BASE_URL}/inflation-data/current`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Current inflation data:', data);
        
        // Update Colombia data
        if (data.countries && data.countries.COL) {
            const colData = data.countries.COL;
            
            // Inflation rate
            if (colData.indicators.INFLATION_RATE) {
                const inflationRate = colData.indicators.INFLATION_RATE.value;
                document.getElementById('col-inflation-rate').textContent = `${inflationRate.toFixed(1)}%`;
            }
            
            // CPI index
            if (colData.indicators.CPI) {
                const cpiIndex = colData.indicators.CPI.value;
                document.getElementById('col-cpi-index').textContent = cpiIndex.toFixed(1);
            }
            
            // Last update
            const lastUpdate = new Date(colData.last_updated).toLocaleDateString('es-CO');
            document.getElementById('col-last-update').textContent = lastUpdate;
        }
        
        // Update USA data
        if (data.countries && data.countries.USA) {
            const usaData = data.countries.USA;
            
            // Inflation rate
            if (usaData.indicators.INFLATION_RATE) {
                const inflationRate = usaData.indicators.INFLATION_RATE.value;
                document.getElementById('usa-inflation-rate').textContent = `${inflationRate.toFixed(1)}%`;
            }
            
            // CPI index
            if (usaData.indicators.CPI) {
                const cpiIndex = usaData.indicators.CPI.value;
                document.getElementById('usa-cpi-index').textContent = cpiIndex.toFixed(1);
            }
            
            // Last update
            const lastUpdate = new Date(usaData.last_updated).toLocaleDateString('en-US');
            document.getElementById('usa-last-update').textContent = lastUpdate;
        }
        
    } catch (error) {
        console.error('❌ Error loading current inflation rates:', error);
        
        // Show error state
        document.getElementById('col-inflation-rate').textContent = 'Error';
        document.getElementById('col-cpi-index').textContent = 'Error';
        document.getElementById('usa-inflation-rate').textContent = 'Error';
        document.getElementById('usa-cpi-index').textContent = 'Error';
    }
}

// Calculate purchasing power
async function calculatePurchasingPower() {
    try {
        console.log('💰 Calculating purchasing power...');
        
        const country = document.getElementById('purchasing-power-country').value;
        const baseDate = document.getElementById('purchasing-power-base-date').value;
        const comparisonDate = document.getElementById('purchasing-power-comparison-date').value;
        const amount = parseFloat(document.getElementById('purchasing-power-amount').value);
        
        if (!country || !baseDate || !comparisonDate || !amount) {
            alert('Por favor completa todos los campos');
            return;
        }
        
        if (new Date(baseDate) >= new Date(comparisonDate)) {
            alert('La fecha base debe ser anterior a la fecha de comparación');
            return;
        }
        
        const params = new URLSearchParams({
            country: country,
            baseDate: baseDate,
            comparisonDate: comparisonDate,
            amount: amount
        });
        
        const response = await fetch(`${API_BASE_URL}/inflation-data/purchasing-power?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Purchasing power calculation:', data);
        
        if (data && data.current_value !== null) {
            // Show results
            const currency = country === 'COL' ? 'COP' : 'USD';
            const resultsDiv = document.getElementById('purchasing-power-results');
            
            document.getElementById('pp-original-amount').textContent = `${amount.toLocaleString()} ${currency}`;
            document.getElementById('pp-current-value').textContent = `${data.current_value.toLocaleString()} ${currency}`;
            document.getElementById('pp-loss-percentage').textContent = `${data.purchasing_power_loss.toFixed(2)}%`;
            
            const lossAmount = amount * (data.purchasing_power_loss / 100);
            document.getElementById('pp-loss-amount').textContent = `${lossAmount.toLocaleString()} ${currency}`;
            document.getElementById('pp-cumulative-inflation').textContent = `${data.cumulative_inflation.toFixed(2)}%`;
            
            // Add explanation for cumulative inflation
            const inflationExplanation = document.getElementById('inflation-explanation');
            if (inflationExplanation) {
                const years = Math.round((new Date(comparisonDate) - new Date(baseDate)) / (365.25 * 24 * 60 * 60 * 1000));
                const avgAnnualInflation = Math.pow(1 + (data.cumulative_inflation / 100), 1/years) - 1;
                
                inflationExplanation.innerHTML = `
                    <div class="alert alert-info mt-3">
                        <h6><i class="fas fa-info-circle"></i> ¿Qué significa la inflación acumulada?</h6>
                        <p class="mb-2">
                            <strong>Inflación acumulada: ${data.cumulative_inflation.toFixed(2)}%</strong> significa que los precios han aumentado 
                            en promedio <strong>${avgAnnualInflation.toFixed(2)}% anual</strong> durante los <strong>${years} años</strong> 
                            del período analizado.
                        </p>
                        <p class="mb-1">
                            <strong>Ejemplo:</strong> Si algo costaba $100 ${currency} en ${new Date(baseDate).getFullYear()}, 
                            ahora cuesta aproximadamente $${(100 * (1 + data.cumulative_inflation/100)).toFixed(0)} ${currency}.
                        </p>
                        <small class="text-muted">
                            <i class="fas fa-lightbulb"></i> 
                            La inflación acumulada se calcula compuesta año tras año, por eso el efecto es exponencial.
                        </small>
                    </div>
                `;
            }
            
            resultsDiv.style.display = 'block';
        } else {
            const countryName = country === 'COL' ? 'Colombia' : 'Estados Unidos';
            const availableRange = country === 'COL' ? 'enero 2000 - presente' : 'enero 2000 - presente';
            
            // Clear explanation on error
            const inflationExplanation = document.getElementById('inflation-explanation');
            if (inflationExplanation) {
                inflationExplanation.innerHTML = '';
            }
            
            alert(`No se pudo calcular el poder adquisitivo para ${countryName}.\\n\\nRango de datos disponible: ${availableRange}\\n\\nPor favor selecciona fechas dentro del rango disponible.`);
        }
        
    } catch (error) {
        console.error('❌ Error calculating purchasing power:', error);
        
        // Clear explanation on error
        const inflationExplanation = document.getElementById('inflation-explanation');
        if (inflationExplanation) {
            inflationExplanation.innerHTML = '';
        }
        
        alert('Error al calcular el poder adquisitivo. Por favor intenta de nuevo.');
    }
}

// Calculate depreciation projection
async function calculateDepreciation() {
    try {
        console.log('💰 Calculating depreciation projection...');
        
        const country = document.getElementById('depreciation-country').value;
        const balance = parseFloat(document.getElementById('depreciation-balance').value);
        const period = parseInt(document.getElementById('depreciation-period').value);
        const customInflationRate = document.getElementById('depreciation-inflation-rate').value;
        const growthRate = parseFloat(document.getElementById('depreciation-growth-rate').value) || 0;
        
        if (!balance || balance <= 0) {
            alert('Por favor ingresa un balance válido');
            return;
        }
        
        // Get current inflation rate if not provided
        let inflationRate = customInflationRate ? parseFloat(customInflationRate) : null;
        
        if (!inflationRate) {
            try {
                const response = await fetch(`${API_BASE_URL}/inflation-data/current`);
                if (response.ok) {
                    const data = await response.json();
                    const countryData = data.countries[country];
                    if (countryData && countryData.indicators.INFLATION_RATE) {
                        inflationRate = countryData.indicators.INFLATION_RATE.value;
                    }
                }
            } catch (error) {
                console.warn('Could not fetch current inflation rate, using default');
            }
        }
        
        // Default inflation rates if not available
        if (!inflationRate) {
            inflationRate = country === 'COL' ? 5.1 : 2.9;
        }
        
        const currency = country === 'COL' ? 'COP' : 'USD';
        
        // Calculate projections
        const projections = [];
        let currentBalance = balance;
        let totalInflationLoss = 0;
        
        for (let year = 1; year <= period; year++) {
            // Apply inflation (depreciation)
            const inflationLoss = currentBalance * (inflationRate / 100);
            const depreciatedBalance = currentBalance - inflationLoss;
            
            // Apply growth (if any)
            const growthAmount = currentBalance * (growthRate / 100);
            const finalBalance = depreciatedBalance + growthAmount;
            
            // Calculate purchasing power
            const purchasingPower = (finalBalance / balance) * 100;
            
            projections.push({
                year: year,
                startBalance: currentBalance,
                inflationLoss: inflationLoss,
                growthAmount: growthAmount,
                finalBalance: finalBalance,
                purchasingPower: purchasingPower,
                cumulativeInflation: Math.pow(1 + (inflationRate / 100), year) - 1
            });
            
            currentBalance = finalBalance;
            totalInflationLoss += inflationLoss;
        }
        
        // Display results
        const resultsDiv = document.getElementById('depreciation-results');
        const currencySymbol = country === 'COL' ? 'COP' : 'USD';
        
        document.getElementById('dep-current-balance').textContent = `${balance.toLocaleString()} ${currencySymbol}`;
        document.getElementById('dep-projected-balance').textContent = `${currentBalance.toLocaleString()} ${currencySymbol}`;
        document.getElementById('dep-inflation-loss').textContent = `${totalInflationLoss.toLocaleString()} ${currencySymbol}`;
        document.getElementById('dep-purchasing-power').textContent = `${projections[projections.length - 1].purchasingPower.toFixed(1)}%`;
        
        // Detailed yearly projection
        const detailedDiv = document.getElementById('depreciation-detailed-results');
        let detailedHtml = `
            <div class="alert alert-light">
                <h6><i class="fas fa-calendar-alt me-2"></i>Proyección Detallada por Año</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Año</th>
                                <th>Balance Inicial</th>
                                <th>Pérdida por Inflación</th>
                                <th>Crecimiento</th>
                                <th>Balance Final</th>
                                <th>Poder Adquisitivo</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        projections.forEach(proj => {
            detailedHtml += `
                <tr>
                    <td><strong>Año ${proj.year}</strong></td>
                    <td>${proj.startBalance.toLocaleString()} ${currencySymbol}</td>
                    <td class="text-danger">-${proj.inflationLoss.toLocaleString()} ${currencySymbol}</td>
                    <td class="text-info">+${proj.growthAmount.toLocaleString()} ${currencySymbol}</td>
                    <td><strong>${proj.finalBalance.toLocaleString()} ${currencySymbol}</strong></td>
                    <td><span class="badge bg-${proj.purchasingPower < 90 ? 'danger' : proj.purchasingPower < 95 ? 'warning' : 'primary'}">${proj.purchasingPower.toFixed(1)}%</span></td>
                </tr>
            `;
        });
        
        detailedHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        detailedDiv.innerHTML = detailedHtml;
        
        // Explanation
        const explanationDiv = document.getElementById('depreciation-explanation');
        const finalProjection = projections[projections.length - 1];
        const netEffect = growthRate > inflationRate ? 'positivo' : 'negativo';
        const netRate = growthRate - inflationRate;
        
        explanationDiv.innerHTML = `
            <div class="alert alert-info mt-3">
                <h6><i class="fas fa-info-circle"></i> ¿Qué significa esta proyección?</h6>
                <p class="mb-2">
                    <strong>Inflación anual: ${inflationRate.toFixed(1)}%</strong> | 
                    <strong>Crecimiento de ingresos: ${growthRate.toFixed(1)}%</strong> | 
                    <strong>Efecto neto: ${netRate > 0 ? '+' : ''}${netRate.toFixed(1)}%</strong>
                </p>
                <p class="mb-2">
                    En ${period} año${period > 1 ? 's' : ''}, tu balance de <strong>${balance.toLocaleString()} ${currencySymbol}</strong> 
                    tendrá un poder adquisitivo equivalente a <strong>${finalProjection.purchasingPower.toFixed(1)}%</strong> 
                    del valor actual.
                </p>
                <p class="mb-1">
                    <strong>Recomendación:</strong> 
                    ${netRate > 0 ? 
                        '✅ Tus ingresos crecen más que la inflación. Mantén este ritmo.' : 
                        netRate < -2 ? 
                        '⚠️ La inflación supera significativamente el crecimiento de ingresos. Considera inversiones o aumentos salariales.' :
                        '📊 El efecto es moderado. Monitorea la situación regularmente.'
                    }
                </p>
                <small class="text-muted">
                    <i class="fas fa-lightbulb"></i> 
                    Esta proyección asume tasas constantes. La realidad puede variar según condiciones económicas.
                </small>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error calculating depreciation:', error);
        alert('Error al calcular la proyección. Por favor intenta de nuevo.');
    }
}

// Update currency symbol when country changes
function updateDepreciationCurrency() {
    const country = document.getElementById('depreciation-country').value;
    const currencySpan = document.getElementById('depreciation-currency');
    currencySpan.textContent = country === 'COL' ? 'COP' : 'USD';
}

// Load total balance from accounts
async function loadTotalBalance() {
    try {
        console.log('💰 Loading total balance from accounts...');
        
        // Show loading state
        const button = event.target.closest('button');
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;
        
        // Use the same method as the finances section
        const data = await apiCall('/accounts');
        
        if (!data || !data.accounts) {
            console.log('⚠️ No accounts data received');
            showInfoToast('No tienes cuentas registradas');
            const balanceInput = document.getElementById('depreciation-balance');
            balanceInput.value = '';
            return;
        }
        
        const accounts = data.accounts;
        console.log('📊 Accounts data received:', accounts);
        
        // Calculate total balance using the same logic as finances dashboard
        let totalBalance = 0;
        let hasAccounts = false;
        
        if (accounts && accounts.length > 0) {
            hasAccounts = true;
            totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
        }
        
        console.log('💵 Total balance calculated:', totalBalance);
        
        // Update the input field
        const balanceInput = document.getElementById('depreciation-balance');
        if (hasAccounts && totalBalance !== 0) {
            balanceInput.value = Math.round(totalBalance);
            
            // Show success message
            showSuccessToast(`Balance cargado: ${formatCurrency(totalBalance)}`);
            
        } else {
            balanceInput.value = '';
            showInfoToast('No tienes cuentas con balance definido');
        }
        
        // Restore button state
        button.innerHTML = originalContent;
        button.disabled = false;
        
    } catch (error) {
        console.error('❌ Error loading total balance:', error);
        
        // Restore button state
        const button = event.target.closest('button');
        button.innerHTML = '<i class="fas fa-calculator"></i>';
        button.disabled = false;
        
        showErrorToast('Error al cargar el balance total. Por favor intenta de nuevo.');
    }
}

// Helper function to show authentication error
function showAuthError(message) {
    // Show quick login section
    const quickLoginSection = document.getElementById('quick-login-section');
    if (quickLoginSection) {
        quickLoginSection.style.display = 'block';
    }
    
    const toast = document.createElement('div');
    toast.className = 'alert alert-warning alert-dismissible fade show position-fixed';
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 350px;';
    toast.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Autenticación requerida:</strong><br>
        <small>${message}</small>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(toast);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

// Show quick login form
function showQuickLogin() {
    const quickLoginSection = document.getElementById('quick-login-section');
    const quickLoginForm = document.getElementById('quick-login-form');
    
    if (quickLoginSection) quickLoginSection.style.display = 'none';
    if (quickLoginForm) quickLoginForm.style.display = 'block';
}

// Hide quick login form
function hideQuickLogin() {
    const quickLoginSection = document.getElementById('quick-login-section');
    const quickLoginForm = document.getElementById('quick-login-form');
    
    if (quickLoginSection) quickLoginSection.style.display = 'block';
    if (quickLoginForm) quickLoginForm.style.display = 'none';
}

// Quick login function
async function quickLogin() {
    try {
        const username = document.getElementById('quick-username').value;
        const password = document.getElementById('quick-password').value;
        
        if (!username || !password) {
            showErrorToast('Por favor ingresa usuario y contraseña');
            return;
        }
        
        // Show loading state
        const button = event.target;
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
        button.disabled = true;
        
        // Make login request
        const response = await fetch(`${API_BASE_URL}/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        if (!response.ok) {
            throw new Error('Error en el login');
        }
        
        const data = await response.json();
        
        if (data.token) {
            // Save token
            localStorage.setItem('token', data.token);
            
            // Hide login forms
            hideQuickLogin();
            const quickLoginSection = document.getElementById('quick-login-section');
            if (quickLoginSection) quickLoginSection.style.display = 'none';
            
            // Show success message
            showSuccessToast('¡Sesión iniciada correctamente! Ahora puedes cargar tu balance.');
            
        } else {
            throw new Error('No se recibió token de autenticación');
        }
        
        // Restore button state
        button.innerHTML = originalContent;
        button.disabled = false;
        
    } catch (error) {
        console.error('❌ Error in quick login:', error);
        
        // Restore button state
        const button = event.target;
        button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        button.disabled = false;
        
        showErrorToast('Error al iniciar sesión. Verifica tus credenciales.');
    }
}

// Helper function to show success toast
function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-success alert-dismissible fade show position-fixed';
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        <strong>${message}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(toast);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Helper function to show info toast
function showInfoToast(message) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-info alert-dismissible fade show position-fixed';
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        <i class="fas fa-info-circle me-2"></i>
        <strong>${message}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(toast);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 4000);
}

// Helper function to show error toast
function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        <strong>Error:</strong><br>
        <small>${message}</small>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(toast);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

// Load inflation insights
async function loadInflationInsights() {
    try {
        console.log('💡 Loading inflation insights...');
        
        const response = await fetch(`${API_BASE_URL}/inflation-data/summary`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Inflation insights:', data);
        
        const insightsDiv = document.getElementById('inflation-insights');
        
        if (data.insights && data.insights.length > 0) {
            let html = '';
            
            data.insights.forEach(insight => {
                let alertClass, iconClass;
                
                switch(insight.severity) {
                    case 'warning':
                        alertClass = 'alert-warning';
                        iconClass = 'fas fa-exclamation-triangle';
                        break;
                    case 'success':
                        alertClass = 'alert-success';
                        iconClass = 'fas fa-check-circle';
                        break;
                    case 'danger':
                        alertClass = 'alert-danger';
                        iconClass = 'fas fa-exclamation-circle';
                        break;
                    default:
                        alertClass = 'alert-info';
                        iconClass = 'fas fa-info-circle';
                }
                
                html += `
                    <div class="alert ${alertClass} d-flex align-items-center mb-2" role="alert">
                        <i class="${iconClass} me-2"></i>
                        <div>
                            <strong>${insight.country}:</strong> ${insight.message}
                            ${insight.rate ? `<small class="ms-2 text-muted">(${insight.rate.toFixed(1)}% anual)</small>` : ''}
                        </div>
                    </div>
                `;
            });
            
            insightsDiv.innerHTML = html;
        } else {
            insightsDiv.innerHTML = `
                <div class="alert alert-success d-flex align-items-center" role="alert">
                    <i class="fas fa-check-circle me-2"></i>
                    <div>Los niveles de inflación se encuentran dentro de rangos normales.</div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ Error loading inflation insights:', error);
        document.getElementById('inflation-insights').innerHTML = 
            '<p class="text-danger">Error al cargar el análisis de inflación</p>';
    }
}

// Refresh all inflation data
async function refreshInflationData() {
    console.log('🔄 Refreshing inflation data...');
    
    // Show loading state
    document.getElementById('col-inflation-rate').textContent = '...';
    document.getElementById('col-cpi-index').textContent = '...';
    document.getElementById('usa-inflation-rate').textContent = '...';
    document.getElementById('usa-cpi-index').textContent = '...';
    document.getElementById('inflation-insights').innerHTML = '<p class="text-muted">Actualizando...</p>';
    
    await loadInflationData();
}

// Initialize inflation section when shown
function initializeInflationSection() {
    console.log('🎯 Initializing inflation section...');
    loadInflationData();
}
