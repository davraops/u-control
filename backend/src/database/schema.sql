-- U-Control Database Schema

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'cash', 'investment')),
    bank VARCHAR(255),
    account_number VARCHAR(255),
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'COP',
    tags TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Incomes table
CREATE TABLE IF NOT EXISTS incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'COP',
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    account_id UUID REFERENCES accounts(id),
    date DATE NOT NULL,
    tags TEXT[],
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_pattern VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    year INTEGER NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT 'monthly',
    period_start DATE,
    period_end DATE,
    budget_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
    percentage DECIMAL(5,2),
    categories JSONB NOT NULL DEFAULT '[]',
    total_budgeted DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_spent DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_remaining DECIMAL(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_income DECIMAL(15,2),
    budget_percentage_of_income DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'COP',
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    account_id UUID REFERENCES accounts(id),
    budget_id UUID REFERENCES budgets(id),
    date DATE NOT NULL,
    tags TEXT[],
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_pattern VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_account_id ON incomes(account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_budget_id ON expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);

-- Insert sample data
INSERT INTO accounts (id, name, type, bank, account_number, balance, currency, tags) VALUES
('5c973d84-2030-408e-bcd6-4fe3b2ef6efd', 'Cuenta Corriente Principal', 'checking', 'Bancolombia', '****1234', 2500000, 'COP', ARRAY['personal']),
('550e8400-e29b-41d4-a716-446655440001', 'Cuenta de Ahorros', 'savings', 'BBVA', '****5678', 5000000, 'COP', ARRAY['personal', 'ahorro']),
('550e8400-e29b-41d4-a716-446655440002', 'Efectivo', 'cash', NULL, NULL, 500000, 'COP', ARRAY['personal'])
ON CONFLICT (id) DO NOTHING;

-- Insert sample incomes for October 2025
INSERT INTO incomes (amount, currency, description, category, account_id, date, is_recurring, recurring_pattern) VALUES
(4500000, 'COP', 'Salario Octubre 2025', 'salario', '5c973d84-2030-408e-bcd6-4fe3b2ef6efd', '2025-10-01', true, 'monthly'),
(800000, 'COP', 'Freelance Proyecto Web Octubre', 'freelance', '5c973d84-2030-408e-bcd6-4fe3b2ef6efd', '2025-10-15', false, NULL)
ON CONFLICT DO NOTHING;

-- Insert sample budget for October 2025
INSERT INTO budgets (name, month, year, period_start, period_end, categories, total_budgeted, status) VALUES
('Presupuesto Personal Octubre 2025', '2025-10', 2025, '2025-10-01', '2025-10-31', 
 '[{"category": "alimentacion", "budgeted": 600000, "spent": 0, "remaining": 600000, "percentage": 0}, {"category": "transporte", "budgeted": 300000, "spent": 0, "remaining": 300000, "percentage": 0}, {"category": "vivienda", "budgeted": 1200000, "spent": 0, "remaining": 1200000, "percentage": 0}, {"category": "salud", "budgeted": 200000, "spent": 0, "remaining": 200000, "percentage": 0}, {"category": "entretenimiento", "budgeted": 400000, "spent": 0, "remaining": 400000, "percentage": 0}]',
 2700000, 'active')
ON CONFLICT DO NOTHING;

-- Insert sample expenses for October 2025
INSERT INTO expenses (amount, currency, description, category, account_id, budget_id, date) VALUES
(180000, 'COP', 'Supermercado La 14', 'alimentacion', '5c973d84-2030-408e-bcd6-4fe3b2ef6efd', (SELECT id FROM budgets WHERE month = '2025-10' LIMIT 1), '2025-10-05'),
(45000, 'COP', 'Uber al trabajo', 'transporte', '5c973d84-2030-408e-bcd6-4fe3b2ef6efd', (SELECT id FROM budgets WHERE month = '2025-10' LIMIT 1), '2025-10-10'),
(1200000, 'COP', 'Arriendo Apartamento', 'vivienda', '5c973d84-2030-408e-bcd6-4fe3b2ef6efd', (SELECT id FROM budgets WHERE month = '2025-10' LIMIT 1), '2025-10-01'),
(85000, 'COP', 'Cine con amigos', 'entretenimiento', '5c973d84-2030-408e-bcd6-4fe3b2ef6efd', (SELECT id FROM budgets WHERE month = '2025-10' LIMIT 1), '2025-10-20')
ON CONFLICT DO NOTHING;
