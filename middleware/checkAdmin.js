const winston = require('winston');
const path = require('path');

// Configure logger for security tracking
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/security.log')
        })
    ]
});

// Define valid admin roles
const ADMIN_ROLES = [
    'admin',
    'college_admin',
    'master_admin',
    'exam_admin',
    'academic_admin'
];

/**
 * Middleware to check if user has admin privileges
 * @param {string|string[]} allowedRoles - Single role or array of roles that are allowed
 * @returns {Function} Express middleware function
 */
const checkAdmin = (allowedRoles = ADMIN_ROLES) => {
    return (req, res, next) => {
        // Check for authenticated user
        if (!req.user || !req.user.id || !req.user.role) {
            // Log unauthorized access attempt
            logger.warn('Unauthorized access attempt', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString(),
                headers: req.headers
            });

            return res.status(401).json({
                status: 'error',
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }

        // Normalize allowed roles to array
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        try {
            // Check if user has required role
            if (!roles.includes(req.user.role)) {
                // Log forbidden access attempt
                logger.warn('Forbidden access attempt', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    requiredRoles: roles,
                    path: req.path,
                    method: req.method,
                    ip: req.ip,
                    timestamp: new Date().toISOString()
                });

                return res.status(403).json({
                    status: 'error',
                    message: 'Insufficient permissions',
                    code: 'FORBIDDEN',
                    details: `Required role: ${roles.join(' or ')}`
                });
            }

            // Log successful admin access
            logger.info('Admin access granted', {
                userId: req.user.id,
                userRole: req.user.role,
                path: req.path,
                method: req.method,
                ip: req.ip,
                timestamp: new Date().toISOString()
            });

            next();
        } catch (error) {
            console.error(error);
            logger.error('Error in checkAdmin middleware', {
                error: error.message,
                stack: error.stack
            });
            res.status(500).json({
                status: 'error',
                message: 'Internal Server Error',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    };
};

module.exports = {
    checkAdmin,
    ADMIN_ROLES
};