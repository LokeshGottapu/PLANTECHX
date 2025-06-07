const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ 
            status: 'error',
            code: 'AUTH_HEADER_MISSING',
            message: 'Authorization header is required'
        });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (!token) {
        return res.status(401).json({ 
            status: 'error',
            code: 'TOKEN_MISSING',
            message: 'Access token is required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check token expiration
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({
                status: 'error',
                code: 'TOKEN_EXPIRED',
                message: 'Token has expired'
            });
        }

        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                code: 'TOKEN_EXPIRED',
                message: 'Token has expired'
            });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({
                status: 'error',
                code: 'TOKEN_INVALID',
                message: 'Invalid token format or signature'
            });
        }
        
        return res.status(403).json({
            status: 'error',
            code: 'TOKEN_VERIFICATION_FAILED',
            message: 'Token verification failed'
        });
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