const pool = require('../config/database');

const SettingsController = {
    async getSettings(req, res) {
        try {
            // First check if settings exist
            const result = await pool.query(
                `SELECT 
                    us.*,
                    json_agg(
                        CASE WHEN pc.id IS NOT NULL THEN 
                            json_build_object(
                                'platform', pc.platform,
                                'connected_at', pc.connected_at,
                                'is_active', pc.is_active
                            )
                        ELSE NULL END
                    ) FILTER (WHERE pc.id IS NOT NULL) as platform_connections
                FROM user_settings us
                LEFT JOIN platform_connections pc ON us.user_id = pc.user_id
                WHERE us.user_id = $1
                GROUP BY us.id`,
                [req.user.userId]
            );

            if (result.rows.length === 0) {
                // Create default settings if none exist
                const defaultSettings = await pool.query(
                    `INSERT INTO user_settings (
                        user_id, 
                        email_notifications, 
                        theme,
                        first_name,
                        last_name,
                        display_name,
                        bio
                    )
                    VALUES ($1, true, 'light', '', '', '', '')
                    RETURNING *`,
                    [req.user.userId]
                );
                return res.json(defaultSettings.rows[0]);
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error fetching user settings:', error);
            res.status(500).json({ message: 'Error fetching user settings' });
        }
    },

    async updateSettings(req, res) {
        const allowedFields = [
            'email_notifications', 
            'theme', 
            'first_name', 
            'last_name', 
            'display_name', 
            'bio'
        ];
        const updates = {};
        let updateQuery = 'UPDATE user_settings SET ';
        const values = [];
        let paramCount = 1;

        // Filter and validate allowed fields
        for (const [key, value] of Object.entries(req.body)) {
            if (allowedFields.includes(key)) {
                updates[key] = value;
                updateQuery += `${key} = $${paramCount}, `;
                values.push(value);
                paramCount++;
            }
        }

        if (values.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        // Remove trailing comma and space
        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ` WHERE user_id = $${paramCount} RETURNING *`;
        values.push(req.user.userId);

        try {
            const result = await pool.query(updateQuery, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Settings not found' });
            }

            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating user settings:', error);
            res.status(500).json({ message: 'Error updating user settings' });
        }
    },

    // This will be expanded later for YouTube integration
    async getPlatformConnections(req, res) {
        try {
            const result = await pool.query(
                `SELECT platform, connected_at, is_active
                 FROM platform_connections
                 WHERE user_id = $1
                 ORDER BY connected_at DESC`,
                [req.user.userId]
            );

            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching platform connections:', error);
            res.status(500).json({ message: 'Error fetching platform connections' });
        }
    }
};

module.exports = SettingsController; 