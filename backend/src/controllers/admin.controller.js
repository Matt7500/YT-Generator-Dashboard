const pool = require('../config/database');

const AdminController = {
    async getAllUsers(req, res) {
        try {
            const result = await pool.query(
                `SELECT id, email, role, created_at 
                 FROM users 
                 ORDER BY created_at DESC`
            );
            
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ message: 'Error fetching users' });
        }
    },

    async getUserById(req, res) {
        const { id } = req.params;
        
        try {
            const result = await pool.query(
                `SELECT id, email, role, created_at 
                 FROM users 
                 WHERE id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ message: 'Error fetching user' });
        }
    },

    async updateUserRole(req, res) {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        try {
            const result = await pool.query(
                `UPDATE users 
                 SET role = $1 
                 WHERE id = $2 
                 RETURNING id, email, role`,
                [role, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            console.log(`User ${id} role updated to ${role} by admin ${req.user.id}`);
            
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating user role:', error);
            res.status(500).json({ message: 'Error updating user role' });
        }
    },

    async getDashboardStats(req, res) {
        try {
            const stats = await pool.query(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
                    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count
                FROM users
            `);

            res.json(stats.rows[0]);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({ message: 'Error fetching dashboard stats' });
        }
    }
};

module.exports = AdminController; 