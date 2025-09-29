const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function initializeDatabase() {
    try {
        console.log('Initializing database...');
        
        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema
        await pool.query(schema);
        
        console.log('Database initialized successfully!');
        
        // Test queries
        const accountsResult = await pool.query('SELECT COUNT(*) FROM accounts');
        const incomesResult = await pool.query('SELECT COUNT(*) FROM incomes');
        const budgetsResult = await pool.query('SELECT COUNT(*) FROM budgets');
        const expensesResult = await pool.query('SELECT COUNT(*) FROM expenses');
        
        console.log('Data counts:');
        console.log(`- Accounts: ${accountsResult.rows[0].count}`);
        console.log(`- Incomes: ${incomesResult.rows[0].count}`);
        console.log(`- Budgets: ${budgetsResult.rows[0].count}`);
        console.log(`- Expenses: ${expensesResult.rows[0].count}`);
        
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('Database initialization completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };
