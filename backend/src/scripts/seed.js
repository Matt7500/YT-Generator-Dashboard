require('dotenv').config();
const User = require('../models/user.model');

async function seedDatabase() {
    try {
        // Create admin user
        const adminUser = await User.create({
            email: 'admin@example.com',
            password: 'admin123Q!',
            role: 'admin'
        });
        console.log('Admin user created:', adminUser);

        // Create regular test user
        const testUser = await User.create({
            email: 'test@example.com',
            password: 'password123',
            role: 'user'
        });
        console.log('Test user created:', testUser);

        console.log('Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase(); 