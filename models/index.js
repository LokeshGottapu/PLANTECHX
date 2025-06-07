const sequelize = require('../config/database');
const User = require('./User');
const College = require('./College');
const Exam = require('./Exam');
const Question = require('./Question');
const UserResult = require('./UserResult');
const Faculty = require('./Faculty');
const FacultyDepartment = require('./FacultyDepartment');

// Define associations
User.hasMany(Exam, { foreignKey: 'created_by' });
Exam.belongsTo(User, { foreignKey: 'created_by' });

Exam.hasMany(Question, { foreignKey: 'exam_id' });
Question.belongsTo(Exam, { foreignKey: 'exam_id' });

User.hasMany(UserResult, { foreignKey: 'user_id' });
UserResult.belongsTo(User, { foreignKey: 'user_id' });

Exam.hasMany(UserResult, { foreignKey: 'exam_id' });
UserResult.belongsTo(Exam, { foreignKey: 'exam_id' });

// Define Faculty associations
User.hasOne(Faculty, { foreignKey: 'user_id' });
Faculty.belongsTo(User, { foreignKey: 'user_id' });

College.hasMany(Faculty, { foreignKey: 'college_id' });
Faculty.belongsTo(College, { foreignKey: 'college_id' });

// Define FacultyDepartment associations
Faculty.hasMany(FacultyDepartment, { foreignKey: 'faculty_id' });
FacultyDepartment.belongsTo(Faculty, { foreignKey: 'faculty_id' });

module.exports = {
  sequelize,
  User,
  College,
  Exam,
  Question,
  UserResult,
  Faculty,
  FacultyDepartment
};