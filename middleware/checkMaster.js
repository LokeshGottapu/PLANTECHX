const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'master-access.log' })
    ]
});

// Define allowed master roles
const MASTER_ROLES = ['master_admin', 'superadmin'];

/**
 * Middleware to check if user has master admin privileges
 * Handles:
 * - Managing colleges
 * - Approving institutions
 * - Granting feature access (LSRW, SWOT, AI)
 * - Broadcasting messages
 * - Viewing platform-wide stats
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const checkMaster = (req, res, next) => {
    // 1. Check if user is authenticated
    if (!req || !req.user) {
        logger.warn('Unauthorized access attempt: No user authenticated', {
            ip: req ? req.ip : null,
            path: req ? req.path : null,
            method: req ? req.method : null
        });

        return res.status(401).json({
            status: 'error',
            message: 'User not authenticated',
            code: 'AUTH_REQUIRED',
            details: 'Please login to access this resource'
        });
    }

    // 2. Validate if user role is master or superadmin
    if (!MASTER_ROLES.includes(req.user.role)) {
        logger.warn('Forbidden access attempt: Invalid role', {
            userId: req.user ? req.user.id : null,
            role: req.user ? req.user.role : null,
            ip: req ? req.ip : null,
            path: req ? req.path : null,
            method: req ? req.method : null,
            timestamp: new Date().toISOString()
        });

        return res.status(403).json({
            status: 'error',
            message: 'Access denied. Master admin privileges required',
            code: 'INSUFFICIENT_PERMISSIONS',
            details: 'This action requires master admin or superadmin privileges'
        });
    }

    // Log successful access
    logger.info('Master admin access granted', {
        userId: req.user ? req.user.id : null,
        role: req.user ? req.user.role : null,
        ip: req ? req.ip : null,
        path: req ? req.path : null,
        method: req ? req.method : null
    });

    // 5. Pass control if user is valid
    next();
};

module.exports = checkMaster;