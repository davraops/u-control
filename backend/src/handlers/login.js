const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const { generateToken } = require('../config/jwt');
const config = require('../config/env');

// Database configuration
const dbConfig = config.database;

module.exports.handler = async (event) => {
    console.log('Login handler called with event:', JSON.stringify(event, null, 2));
    
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: ''
        };
    }
    
    try {
        const { email, password } = JSON.parse(event.body || '{}');
        
        if (!email || !password) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Email y contraseña son requeridos'
                })
            };
        }

        const client = new Client(dbConfig);
        await client.connect();

        // Find user by email
        const userResult = await client.query(
            'SELECT id, email, password, name FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            await client.end();
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Credenciales inválidas'
                })
            };
        }

        const user = userResult.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            await client.end();
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Credenciales inválidas'
                })
            };
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.id, 
            email: user.email 
        });

        await client.end();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            })
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                error: 'Error interno del servidor'
            })
        };
    }
};

