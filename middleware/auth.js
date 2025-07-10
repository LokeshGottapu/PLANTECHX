const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || typeof token !== 'string') {
        return res.status(401).json({ message: 'Authentication token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || typeof decoded !== 'object') {
            throw new Error('Decoded token is invalid');
        }
        console.log('Decoded token:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (!req || !req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (typeof req.user.role !== 'string') {
            return res.status(403).json({ message: 'User role is invalid' });
        }

        if (req.user.role === 'master_admin') {
            return next(); // Master admin has access to everything
        }

        if (typeof role === 'string' && req.user.role !== role) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (Array.isArray(role)) {
            if (!role.length) {
                return res.status(403).json({ message: 'Invalid roles specified' });
            }

            if (!role.includes(req.user.role)) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRole
};