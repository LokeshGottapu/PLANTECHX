const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

const ROLE_HIERARCHY = {
    'master_admin': ['master_admin', 'admin', 'faculty', 'user'],
    'admin': ['admin', 'faculty', 'user'],
    'faculty': ['faculty', 'user'],
    'user': ['user']
};

const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userRole = req.user.role;
        const allowedRoles = ROLE_HIERARCHY[userRole] || [];

        if (!allowedRoles.includes(requiredRole)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRole
};