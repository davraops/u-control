const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const { generateToken, verifyToken } = require('../config/jwt');
const config = require('../config/env');

// Database configuration
const dbConfig = config.database;

// Login handler
module.exports.login = async (event) => {
    console.log('Login handler called with event:', JSON.stringify(event, null, 2));
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

// Register handler
module.exports.register = async (event) => {
    try {
        const { email, password, name } = JSON.parse(event.body || '{}');
        
        if (!email || !password || !name) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Email, contraseña y nombre son requeridos'
                })
            };
        }

        const client = new Client(dbConfig);
        await client.connect();

        // Check if user already exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            await client.end();
            return {
                statusCode: 409,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'El usuario ya existe'
                })
            };
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await client.query(
            'INSERT INTO users (email, password, name, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, email, name',
            [email, hashedPassword, name]
        );

        const newUser = result.rows[0];

        // Generate JWT token
        const token = generateToken({
            userId: newUser.id, 
            email: newUser.email 
        });

        await client.end();

        return {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                token,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name
                }
            })
        };

    } catch (error) {
        console.error('Register error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
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

// Verify token middleware
module.exports.verifyToken = async (event) => {
    try {
        const token = event.headers.Authorization || event.headers.authorization;
        
        if (!token || !token.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                body: JSON.stringify({
                    error: 'Token de autorización requerido'
                })
            };
        }

        const actualToken = token.replace('Bearer ', '');
        const decoded = verifyToken(actualToken);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                valid: true,
                user: decoded
            })
        };

    } catch (error) {
        console.error('Token verification error:', error);
        return {
            statusCode: 401,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            body: JSON.stringify({
                error: 'Token inválido'
            })
        };
    }
};
