const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

class AuthController {
    static async register(req, res) {
        try {
            const { email, password, name } = req.body;
            
            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ message: 'Email already registered' });
            }

            // Create new user (automatically verified for now)
            const user = await User.create({ 
                email, 
                password,
                name,
                isVerified: true // Skip email verification for now
            });

            // Generate token
            const accessToken = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            // Set HTTP-only cookie
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            return res.status(201).json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                message: 'Registration successful'
            });
        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Error creating user' });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            // Find user
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Verify password
            const isValid = await User.verifyPassword(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Generate token
            const accessToken = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            // Set HTTP-only cookie
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            return res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ message: 'Error during login' });
        }
    }

    static async logout(req, res) {
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        return res.json({ message: 'Logged out successfully' });
    }
}

module.exports = AuthController; 