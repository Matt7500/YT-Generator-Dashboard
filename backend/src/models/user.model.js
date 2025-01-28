const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database');

class User {
    static async create({ email, password, role = 'user', name = null }) {
        try {
            const passwordHash = await bcrypt.hash(password, 12);
            const query = `
                INSERT INTO users (
                    email, 
                    password_hash, 
                    role,
                    is_verified,
                    settings,
                    name
                )
                VALUES ($1, $2, $3, true, $4, $5)
                RETURNING id, email, role, name;
            `;
            const defaultSettings = {
                theme: 'light',
                email_notifications: false,
                two_factor_enabled: false
            };
            const defaultName = name || email.split('@')[0];
            const values = [email, passwordHash, role, JSON.stringify(defaultSettings), defaultName];
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM users WHERE email = $1';
            const result = await pool.query(query, [email]);
            return result.rows[0];
        } catch (error) {
            console.error('Error finding user:', error);
            throw error;
        }
    }

    static async verifyPassword(password, passwordHash) {
        return bcrypt.compare(password, passwordHash);
    }

    static async verifyEmail(userId, token) {
        try {
            const query = `
                UPDATE users 
                SET is_verified = true, 
                    verification_token = NULL 
                WHERE id = $1 AND verification_token = $2
                RETURNING id, email, is_verified;
            `;
            const result = await pool.query(query, [userId, token]);
            return result.rows[0];
        } catch (error) {
            console.error('Error verifying email:', error);
            throw error;
        }
    }

    static async createPasswordReset(email) {
        try {
            const user = await this.findByEmail(email);
            if (!user) return null;

            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = await bcrypt.hash(resetToken, 12);
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour

            const query = `
                UPDATE users 
                SET password_reset_token = $1,
                    password_reset_expires = $2,
                    password_reset_attempts = password_reset_attempts + 1
                WHERE id = $3
                RETURNING id;
            `;
            await pool.query(query, [resetTokenHash, expiresAt, user.id]);
            
            return resetToken; // This will be sent via email
        } catch (error) {
            console.error('Error creating password reset:', error);
            throw error;
        }
    }

    static async resetPassword(userId, newPassword) {
        try {
            const passwordHash = await bcrypt.hash(newPassword, 12);
            
            const query = `
                UPDATE users 
                SET password_hash = $1,
                    password_reset_token = NULL,
                    password_reset_expires = NULL,
                    last_password_change = CURRENT_TIMESTAMP,
                    password_reset_attempts = 0
                WHERE id = $2
                RETURNING id, email;
            `;
            const result = await pool.query(query, [passwordHash, userId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    }

    static async updateLoginAttempts(userId, success) {
        try {
            const query = `
                UPDATE users 
                SET 
                    login_attempts = CASE WHEN $2 THEN 0 ELSE login_attempts + 1 END,
                    last_login = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE last_login END,
                    locked_until = CASE 
                        WHEN $2 THEN NULL 
                        WHEN login_attempts >= 4 THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes'
                        ELSE locked_until 
                    END
                WHERE id = $1
                RETURNING login_attempts, locked_until;
            `;
            const result = await pool.query(query, [userId, success]);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating login attempts:', error);
            throw error;
        }
    }

    static async isAccountLocked(userId) {
        try {
            const query = `
                SELECT locked_until 
                FROM users 
                WHERE id = $1 AND locked_until > CURRENT_TIMESTAMP;
            `;
            const result = await pool.query(query, [userId]);
            return result.rows[0] ? result.rows[0].locked_until : null;
        } catch (error) {
            console.error('Error checking account lock:', error);
            throw error;
        }
    }

    static async updateProfile(userId, { name }) {
        try {
            const query = `
                UPDATE users 
                SET name = $1
                WHERE id = $2
                RETURNING id, email, name;
            `;
            const result = await pool.query(query, [name, userId]);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }
}

module.exports = User; 