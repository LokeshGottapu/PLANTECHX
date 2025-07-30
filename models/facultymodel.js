const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

class Faculty extends Model {
    // Instance method to check password
    async validatePassword(password) {
        return bcrypt.compare(password, this.password);
    }

    // Virtual field for assigned exams count
    static async getAssignedExamsCount(facultyId) {
        return this.sequelize.models.Exam.count({
            where: { faculty_id: facultyId }
        });
    }
}

Faculty.init({
    // Core Fields
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [6, 100]
        }
    },
    role: {
        type: DataTypes.ENUM('faculty', 'exam_admin', 'academic_admin'),
        defaultValue: 'faculty',
        allowNull: false
    },
    college_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'colleges',
            key: 'id'
        }
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },

    // Additional Fields
    phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            is: /^\+?[1-9]\d{1,14}$/ // Basic phone number validation
        }
    },
    profile_pic: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    reset_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reset_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Faculty',
    tableName: 'faculties',
    timestamps: true,
    underscored: true, // Use snake_case for column names
    hooks: {
        // Hash password before saving
        beforeSave: async (faculty) => {
            if (faculty.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                faculty.password = await bcrypt.hash(faculty.password, salt);
            }
        }
    }
});

// Define Associations
Faculty.associate = (models) => {
    // Faculty belongs to a College
    Faculty.belongsTo(models.College, {
        foreignKey: 'college_id',
        as: 'college'
    });

    // Faculty can create many Exams
    Faculty.hasMany(models.Exam, {
        foreignKey: 'faculty_id',
        as: 'exams'
    });

    // Faculty can upload many StudyMaterials
    Faculty.hasMany(models.StudyMaterial, {
        foreignKey: 'faculty_id',
        as: 'studyMaterials'
    });
};

module.exports = Faculty;
