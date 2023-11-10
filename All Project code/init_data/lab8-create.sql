DROP TABLE IF EXISTS students CASCADE;
CREATE TABLE students(
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(200) NOT NULL,
    year VARCHAR(15) NOT NULL,
    major VARCHAR(30) NOT NULL,
    degree VARCHAR(15) NOT NULL
);

DROP TABLE IF EXISTS courses CASCADE;
CREATE TABLE courses(
    course_id NUMERIC PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credit_hours NUMERIC NOT NULL
);

DROP TABLE IF EXISTS student_courses;
CREATE TABLE student_courses(
    course_id INTEGER NOT NULL REFERENCES courses (course_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students (student_id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS prerequisites;
CREATE TABLE IF NOT EXISTS prerequisites(
    course_id INTEGER NOT NULL REFERENCES courses (course_id) ON DELETE CASCADE,
    prerequisite_id INTEGER NOT NULL REFERENCES courses (course_id) ON DELETE CASCADE
);


-- Views to simplify queries in the server.

CREATE OR REPLACE VIEW
  course_prerequisite_count AS
SELECT
  c.course_id,
  COUNT(p.prerequisite_id) as num_prerequisites
FROM
  courses c
  LEFT JOIN prerequisites p on c.course_id = p.course_id
GROUP BY
  c.course_id;

CREATE OR REPLACE VIEW
  student_prerequisite_count AS
SELECT
  c.course_id,
  sc.student_id,
  COUNT(*) as num_prerequisites_satisfied
FROM
  courses c
  LEFT JOIN prerequisites p on c.course_id = p.course_id
  LEFT JOIN student_courses sc ON p.prerequisite_id = sc.course_id
GROUP BY
  c.course_id,
  sc.student_id;
