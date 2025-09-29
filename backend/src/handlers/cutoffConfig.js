const { corsHeaders } = require('../middleware/cors');
const { cutoffManager } = require('../utils/cutoffDates');

// Configuración de fechas de corte (en producción esto vendría de la base de datos)
let cutoffConfig = {
  cutoffDay: 23,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

module.exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { httpMethod, body } = event;

    switch (httpMethod) {
      case 'GET':
        // Obtener configuración actual de fechas de corte
        const currentPeriod = cutoffManager.getCurrentFinancialPeriod();
        
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config: cutoffConfig,
            currentPeriod: currentPeriod,
            message: 'Configuración de fechas de corte obtenida exitosamente'
          })
        };

      case 'PUT':
        // Actualizar configuración de fechas de corte
        const updateData = JSON.parse(body || '{}');
        
        if (updateData.cutoffDay !== undefined) {
          if (updateData.cutoffDay < 1 || updateData.cutoffDay > 31) {
            return {
              statusCode: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: 'El día de corte debe estar entre 1 y 31',
                errors: ['cutoffDay debe ser un número entre 1 y 31']
              })
            };
          }
          
          cutoffManager.setCutoffDay(updateData.cutoffDay);
          cutoffConfig.cutoffDay = updateData.cutoffDay;
        }
        
        if (updateData.isActive !== undefined) {
          cutoffConfig.isActive = updateData.isActive;
        }
        
        cutoffConfig.updatedAt = new Date().toISOString();
        
        const updatedPeriod = cutoffManager.getCurrentFinancialPeriod();
        
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            config: cutoffConfig,
            currentPeriod: updatedPeriod,
            message: 'Configuración de fechas de corte actualizada exitosamente'
          })
        };

      case 'POST':
        // Obtener información de períodos financieros
        const requestData = JSON.parse(body || '{}');
        
        if (requestData.action === 'getPeriods') {
          const { startDate, endDate } = requestData;
          
          if (!startDate || !endDate) {
            return {
              statusCode: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: 'Se requieren startDate y endDate',
                errors: ['startDate y endDate son requeridos']
              })
            };
          }
          
          const periods = cutoffManager.getFinancialPeriodsBetween(
            new Date(startDate), 
            new Date(endDate)
          );
          
          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              periods: periods,
              message: 'Períodos financieros obtenidos exitosamente'
            })
          };
        }
        
        if (requestData.action === 'checkDate') {
          const { date, periodMonth } = requestData;
          
          if (!date || !periodMonth) {
            return {
              statusCode: 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                message: 'Se requieren date y periodMonth',
                errors: ['date y periodMonth son requeridos']
              })
            };
          }
          
          const isInPeriod = cutoffManager.isDateInFinancialPeriod(
            new Date(date), 
            periodMonth
          );
          
          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              isInPeriod: isInPeriod,
              date: date,
              periodMonth: periodMonth,
              message: 'Verificación de fecha completada'
            })
          };
        }
        
        return {
          statusCode: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: 'Acción no válida',
            errors: ['La acción debe ser getPeriods o checkDate']
          })
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
    console.error('Error en cutoffConfig handler:', error);
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
