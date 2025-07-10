const Joi = require('joi');

// Custom validation helpers
const customValidators = {
    password: (value, helpers) => {
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(value)) {
            return helpers.message('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character');
        }
        return value;
    },
    phoneNumber: (value, helpers) => {
        if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value)) {
            return helpers.message('Invalid phone number format');
        }
        return value;
    }
};

const validate = (schema) => {
    return (req, res, next) => {
        const validationOptions = {
            abortEarly: false,    // Return all errors
            allowUnknown: true,   // Allow unknown props
            stripUnknown: true    // Remove unknown props
        };

        const { error, value } = schema.validate(
            {
                body: req.body,
                query: req.query,
                params: req.params
            },
            validationOptions
        );

        if (error) {
            const validationErrors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));

            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: validationErrors
            });
        }

        // Replace request properties with validated values
        req.body = value.body;
        req.query = value.query;
        req.params = value.params;

        return next();
    };
};

// Common validation schemas
const schemas = {
    // Auth Module Validations
    registerInput: Joi.object({
        body: Joi.object({
            username: Joi.string().required().min(3).max(30).trim(),
            email: Joi.string().required().email(),
            password: Joi.string().required().custom(customValidators.password),
            confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
                'any.only': 'Passwords must match'
            }),
            role: Joi.string().valid('student', 'faculty', 'college_admin', 'master_admin')
        })
    }),

    loginInput: Joi.object({
        body: Joi.object({
            email: Joi.string().required().email(),
            password: Joi.string().required()
        })
    }),

    emailValidation: Joi.object({
        body: Joi.object({
            email: Joi.string().required().email()
        })
    }),

    // College Management Validations
    collegeInput: Joi.object({
        body: Joi.object({
            name: Joi.string().required().min(3).max(100).trim(),
            email: Joi.string().required().email(),
            phone: Joi.string().required().custom(customValidators.phoneNumber),
            address: Joi.object({
                street: Joi.string().required(),
                city: Joi.string().required(),
                state: Joi.string().required(),
                pincode: Joi.string().required().pattern(/^[0-9]{6}$/)
            }),
            website: Joi.string().uri().allow(''),
            establishedYear: Joi.number().integer().min(1800).max(new Date().getFullYear())
        })
    }),

    // Exam Management Validations
    examInput: Joi.object({
        body: Joi.object({
            title: Joi.string().required().min(5).max(200),
            description: Joi.string().max(1000),
            duration: Joi.number().integer().min(5).max(180).required(),
            totalMarks: Joi.number().integer().min(1).required(),
            passingMarks: Joi.number().integer().min(1).required(),
            questionFormat: Joi.string().valid('mcq', 'descriptive', 'mixed').required(),
            startTime: Joi.date().iso().min('now').required(),
            endTime: Joi.date().iso().min(Joi.ref('startTime')).required()
        })
    }),

    // Student Management Validations
    studentInput: Joi.object({
        body: Joi.object({
            name: Joi.string().required().min(3).max(50),
            email: Joi.string().required().email(),
            rollNumber: Joi.string().required().pattern(/^[A-Z0-9]{8,12}$/),
            department: Joi.string().required(),
            semester: Joi.number().integer().min(1).max(8),
            phone: Joi.string().custom(customValidators.phoneNumber),
            parentPhone: Joi.string().custom(customValidators.phoneNumber)
        })
    }),

    // File Upload Validations
    fileUpload: Joi.object({
        body: Joi.object({
            title: Joi.string().required().min(3).max(100),
            description: Joi.string().max(500)
        }),
        file: Joi.object({
            mimetype: Joi.string().valid(
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'video/mp4',
                'image/jpeg',
                'image/png'
            ).required(),
            size: Joi.number().max(50 * 1024 * 1024) // 50MB max
        })
    }),

    // Notification Validations
    notificationInput: Joi.object({
        body: Joi.object({
            title: Joi.string().required().min(5).max(100),
            message: Joi.string().required().min(10).max(1000),
            audience: Joi.string().valid('all', 'students', 'faculty', 'admins').required(),
            priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
            expiresAt: Joi.date().iso().min('now')
        })
    }),

    // SWOT Analysis Validations
    swotInput: Joi.object({
        body: Joi.object({
            studentId: Joi.number().integer().required(),
            startDate: Joi.date().iso().required(),
            endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
            includeExams: Joi.boolean().default(true),
            includeAttendance: Joi.boolean().default(true),
            includeAssignments: Joi.boolean().default(true)
        })
    }),

    // Existing schemas
    userPerformance: Joi.object({
        params: Joi.object({
            userId: Joi.number().integer().required().messages({
                'number.base': 'User ID must be a number',
                'number.integer': 'User ID must be an integer',
                'any.required': 'User ID is required'
            })
        }),
        query: Joi.object({
            examType: Joi.string().trim(),
            startDate: Joi.date().iso(),
            endDate: Joi.date().iso().min(Joi.ref('startDate'))
        })
    }),

    aiQuestions: Joi.object({
        query: Joi.object({
            topic: Joi.string().required().trim().min(2).max(100).messages({
                'string.empty': 'Topic is required',
                'string.min': 'Topic must be at least 2 characters long',
                'string.max': 'Topic cannot exceed 100 characters'
            }),
            numberOfQuestions: Joi.number().integer().min(1).max(20).default(10),
            difficultyLevel: Joi.string().valid('easy', 'medium', 'hard').default('medium')
        })
    }),

    pagination: Joi.object({
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            sortBy: Joi.string().valid('createdAt', 'updatedAt').default('createdAt'),
            order: Joi.string().valid('asc', 'desc').default('desc')
        })
    }),

    search: Joi.object({
        query: Joi.object({
            q: Joi.string().trim().min(1).max(100).required(),
            type: Joi.string().valid('user', 'college', 'exam', 'all').default('all')
        })
    })
};

module.exports = {
    validate,
    schemas,
    customValidators
};