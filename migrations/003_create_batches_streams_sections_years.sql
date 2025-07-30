-- Batches table
CREATE TABLE IF NOT EXISTS batches (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_year INT,
    end_year INT,
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE CASCADE
);

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
    stream_id INT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE CASCADE
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    stream_id INT,
    name VARCHAR(100) NOT NULL,
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (stream_id) REFERENCES streams(stream_id) ON DELETE SET NULL
);

-- Years table
CREATE TABLE IF NOT EXISTS years (
    year_id INT AUTO_INCREMENT PRIMARY KEY,
    stream_id INT NOT NULL,
    year_number INT NOT NULL,
    FOREIGN KEY (stream_id) REFERENCES streams(stream_id) ON DELETE CASCADE
);