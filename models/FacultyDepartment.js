const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FacultyDepartment = sequelize.define('FacultyDepartment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'faculty',
      key: 'id'
    }
  },
  department_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  joining_date: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'faculty_departments',
  timestamps: true
});

module.exports = FacultyDepartment;