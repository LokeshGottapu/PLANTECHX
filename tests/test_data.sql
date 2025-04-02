-- Test Data Population Script

-- Users with different roles
INSERT INTO users (username, email, password, role, batch_year) VALUES
('admin_user', 'admin@plantechx.com', '$2a$10$XYZ...', 'master_admin', NULL),
('faculty_smith', 'smith@plantechx.com', '$2a$10$ABC...', 'faculty', NULL),
('faculty_jones', 'jones@plantechx.com', '$2a$10$DEF...', 'faculty', NULL),
('student_alice', 'alice@student.com', '$2a$10$GHI...', 'user', 2023),
('student_bob', 'bob@student.com', '$2a$10$JKL...', 'user', 2023),
('student_carol', 'carol@student.com', '$2a$10$MNO...', 'user', 2024);

-- Exams
INSERT INTO exams (exam_name, exam_type, created_by, duration_minutes, total_marks, passing_marks) VALUES
('English Proficiency Test', 'language', 2, 120, 100, 60),
('Technical Skills Assessment', 'technical', 2, 90, 100, 70),
('Communication Skills', 'soft_skills', 3, 60, 50, 30);

-- Questions for English Proficiency Test
INSERT INTO questions (exam_id, question_text, options, correct_answer, marks, topic) VALUES
(1, 'Choose the correct form of the verb: He ___ to the store yesterday.', '{"A":"go","B":"goes","C":"went","D":"gone"}', 'C', 5, 'reading'),
(1, 'Listen to the audio and select the main topic discussed.', '{"A":"Weather forecast","B":"News report","C":"Business meeting","D":"Sports update"}', 'B', 5, 'listening'),
(1, 'Write a paragraph about your future career goals.', NULL, NULL, 10, 'writing');

-- Questions for Technical Assessment
INSERT INTO questions (exam_id, question_text, options, correct_answer, marks, topic) VALUES
(2, 'What is the primary purpose of a constructor in OOP?', '{"A":"To destroy objects","B":"To initialize objects","C":"To copy objects","D":"To compare objects"}', 'B', 5, 'technical'),
(2, 'Which data structure would be most efficient for implementing a LIFO system?', '{"A":"Queue","B":"Stack","C":"Array","D":"Linked List"}', 'B', 5, 'technical');

-- User Results
INSERT INTO user_results (user_id, exam_id, score, completion_time, answers) VALUES
(4, 1, 85, 110, '{"1":true,"2":true,"3":false}'),
(5, 1, 75, 115, '{"1":true,"2":false,"3":true}'),
(6, 1, 90, 100, '{"1":true,"2":true,"3":true}'),
(4, 2, 80, 85, '{"1":true,"2":true}'),
(5, 2, 65, 88, '{"1":false,"2":true}');

-- College Information
INSERT INTO colleges (college_name, location, contact_email) VALUES
('Tech Institute', 'Silicon Valley', 'admin@techinstitute.edu'),
('Engineering College', 'Boston', 'info@engcollege.edu');

-- Faculty Department Assignment
INSERT INTO faculty_departments (faculty_id, department_name, joining_date) VALUES
(2, 'English Department', '2023-01-15'),
(3, 'Computer Science', '2023-02-01');