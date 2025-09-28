const { corsHeaders } = require('../middleware/cors');
const Account = require('../models/Account');

// Simulamos una base de datos en memoria (en producción sería PostgreSQL)
let accounts = [
  new Account({
    name: 'Efectivo Personal',
    type: 'cash',
    bank: null,
    accountNumber: null,
    balance: 500000,
    currency: 'COP',
    tags: ['personal']
  }),
  new Account({
    name: 'Cuenta Corriente Personal',
    type: 'checking',
    bank: 'Banco Santander',
    accountNumber: '****1234',
    balance: 2500000,
    currency: 'COP',
    tags: ['personal']
  }),
  new Account({
    name: 'Ahorros Empresa',
    type: 'savings',
    bank: 'BBVA',
    accountNumber: '****5678',
    balance: 5000000,
    currency: 'COP',
    tags: ['empresa']
  }),
  new Account({
    name: 'Cuenta Empresarial',
    type: 'checking',
    bank: 'Bancolombia',
    accountNumber: '****9999',
    balance: 15000000,
    currency: 'COP',
    tags: ['empresa', 'gastos']
  }),
  new Account({
    name: 'Fondo de Emergencia',
    type: 'savings',
    bank: 'Scotiabank',
    accountNumber: '****7777',
    balance: 8000000,
    currency: 'COP',
    tags: ['personal', 'emergencia']
  })
];

module.exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { httpMethod, pathParameters, body } = event;
    const accountId = pathParameters?.id;

    switch (httpMethod) {
      case 'GET':
        if (accountId) {
          // Obtener una cuenta específica
          const account = accounts.find(acc => acc.id === accountId);
          if (!account) {
            return {
              statusCode: 404,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ message: 'Cuenta no encontrada' })
            };
          }
          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(account.toJSON())
          };
        } else {
          // Obtener todas las cuentas
          const activeAccounts = accounts.filter(acc => acc.isActive);
          
          // Calcular resumen por tags
          const tagSummary = {};
          activeAccounts.forEach(acc => {
            acc.tags.forEach(tag => {
              if (!tagSummary[tag]) {
                tagSummary[tag] = { count: 0, balance: 0 };
              }
              tagSummary[tag].count += 1;
              tagSummary[tag].balance += acc.balance;
            });
          });

          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              accounts: activeAccounts.map(acc => acc.toJSON()),
              total: activeAccounts.length,
              totalBalance: activeAccounts.reduce((sum, acc) => sum + acc.balance, 0),
              tagSummary: tagSummary,
              availableTags: Account.getAvailableTags()
            })
          };
        }

      case 'POST':
        // Crear nueva cuenta
        const accountData = JSON.parse(body || '{}');
        const newAccount = new Account(accountData);
        
        const validation = newAccount.validate();
        if (!validation.isValid) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Datos de cuenta inválidos',
              errors: validation.errors
            })
          };
        }

        accounts.push(newAccount);
        return {
          statusCode: 201,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newAccount.toJSON())
        };

      case 'PUT':
        // Actualizar cuenta
        if (!accountId) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'ID de cuenta requerido' })
          };
        }

        const accountIndex = accounts.findIndex(acc => acc.id === accountId);
        if (accountIndex === -1) {
          return {
            statusCode: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'Cuenta no encontrada' })
          };
        }

        const updateData = JSON.parse(body || '{}');
        const updatedAccount = new Account({
          ...accounts[accountIndex],
          ...updateData,
          id: accountId, // Mantener el ID original
          updatedAt: new Date().toISOString()
        });

        const updateValidation = updatedAccount.validate();
        if (!updateValidation.isValid) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: 'Datos de cuenta inválidos',
              errors: updateValidation.errors
            })
          };
        }

        accounts[accountIndex] = updatedAccount;
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedAccount.toJSON())
        };

      case 'DELETE':
        // Eliminar cuenta (soft delete)
        if (!accountId) {
          return {
            statusCode: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'ID de cuenta requerido' })
          };
        }

        const deleteIndex = accounts.findIndex(acc => acc.id === accountId);
        if (deleteIndex === -1) {
          return {
            statusCode: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: 'Cuenta no encontrada' })
          };
        }

        accounts[deleteIndex].isActive = false;
        accounts[deleteIndex].updatedAt = new Date().toISOString();

        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Cuenta eliminada exitosamente' })
        };

      default:
        return {
          statusCode: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Método no permitido' })
        };
    }

  } catch (error) {
    console.error('Error en accounts handler:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Error interno del servidor',
        error: error.message
      })
    };
  }
};
