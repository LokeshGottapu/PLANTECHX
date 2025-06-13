const sequelize = require('../config/database');
const User = require('./User');
const Exam = require('./Exam');
const Question = require('./Question');
const UserResult = require('./UserResult');
const College = require('./College');
const Faculty = require('./Faculty');
const FacultyDepartment = require('./FacultyDepartment');

// Define associations
Exam.hasMany(Question, { foreignKey: 'exam_id' });
Question.belongsTo(Exam, { foreignKey: 'exam_id' });

Exam.hasMany(UserResult, { foreignKey: 'exam_id' });
UserResult.belongsTo(Exam, { foreignKey: 'exam_id' });

User.hasMany(UserResult, { foreignKey: 'user_id' });
UserResult.belongsTo(User, { foreignKey: 'user_id' });

College.hasMany(Faculty, { foreignKey: 'college_id' });
Faculty.belongsTo(College, { foreignKey: 'college_id' });

Faculty.belongsTo(FacultyDepartment, { foreignKey: 'department_id' });
FacultyDepartment.hasMany(Faculty, { foreignKey: 'department_id' });

module.exports = {
    sequelize,
    User,
    Exam,
    Question,
    UserResult,
    College,
    Faculty,
    FacultyDepartment
};