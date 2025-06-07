const { sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

before(async () => {
    // Sync database
    await sequelize.sync({ force: true });

    // Create test users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const facultyPassword = await bcrypt.hash('faculty123', 10);

    await User.bulkCreate([
        {
            username: 'admin',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'admin'
        },
        {
            username: 'faculty',
            email: 'faculty@example.com',
            password: facultyPassword,
            role: 'faculty'
        }
    ]);
});

after(async () => {
    // Close database connection
    await sequelize.close();
}); 