const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserResult = sequelize.define('UserResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  exam_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'exams',
      key: 'id'
    }
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  completion_time: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  answers: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'user_results',
  timestamps: true
});

module.exports = UserResult;