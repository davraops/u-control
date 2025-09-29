const incomesHandler = require('./src/handlers/incomes-db');
const expensesHandler = require('./src/handlers/expenses-db');
const budgetsHandler = require('./src/handlers/budgets-db');
const accountsHandler = require('./src/handlers/accounts-db');

async function testHandlers() {
  console.log('Testing PostgreSQL handlers...\n');
  
  try {
    // Test incomes
    console.log('=== TESTING INCOMES ===');
    const incomesResult = await incomesHandler.handler({ httpMethod: 'GET' });
    const incomesData = JSON.parse(incomesResult.body);
    console.log(`Found ${incomesData.incomes.length} incomes:`);
    incomesData.incomes.forEach(income => {
      console.log(`- ${income.description}: ${income.amount} COP (${income.date})`);
    });
    
    // Test expenses
    console.log('\n=== TESTING EXPENSES ===');
    const expensesResult = await expensesHandler.handler({ httpMethod: 'GET' });
    const expensesData = JSON.parse(expensesResult.body);
    console.log(`Found ${expensesData.expenses.length} expenses:`);
    expensesData.expenses.forEach(expense => {
      console.log(`- ${expense.description}: ${expense.amount} COP (${expense.date})`);
    });
    
    // Test budgets
    console.log('\n=== TESTING BUDGETS ===');
    const budgetsResult = await budgetsHandler.handler({ httpMethod: 'GET' });
    const budgetsData = JSON.parse(budgetsResult.body);
    console.log(`Found ${budgetsData.budgets.length} budgets:`);
    budgetsData.budgets.forEach(budget => {
      console.log(`- ${budget.name}: ${budget.month}/${budget.year} (${budget.status})`);
    });
    
    // Test accounts
    console.log('\n=== TESTING ACCOUNTS ===');
    const accountsResult = await accountsHandler.handler({ httpMethod: 'GET' });
    const accountsData = JSON.parse(accountsResult.body);
    console.log(`Found ${accountsData.accounts.length} accounts:`);
    accountsData.accounts.forEach(account => {
      console.log(`- ${account.name}: ${account.type} (${account.balance} ${account.currency})`);
    });
    
    console.log('\n✅ All handlers are working correctly with PostgreSQL!');
    
  } catch (error) {
    console.error('❌ Error testing handlers:', error);
  }
}

testHandlers();
