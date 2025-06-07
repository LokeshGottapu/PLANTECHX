const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const users = new Map();
const loginAttempts = new Map();

const mockAuthController = {
    register: async (req, res) => {
        const { username, email, password } = req.body;

        if (users.has(email)) {
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = users.size + 1;

        users.set(email, {
            id: userId,
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'User registered successfully',
            userId
        });
    },

    login: async (req, res) => {
        const { email, password } = req.body;

        // Check rate limiting
        const attempts = loginAttempts.get(email) || 0;
        if (attempts >= 5) {
            return res.status(429).json({
                error: 'Too many login attempts, please try again later.'
            });
        }

        const user = users.get(email);

        if (!user) {
            loginAttempts.set(email, attempts + 1);
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            loginAttempts.set(email, attempts + 1);
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        // Reset login attempts on successful login
        loginAttempts.delete(email);

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        res.status(200).json({
            data: {
                token,
                userId: user.id
            }
        });
    }
};

module.exports = mockAuthController; 