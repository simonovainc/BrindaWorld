-- ============================================================
-- MIGRATION 017 — Teacher Portal
-- RUN THIS MANUALLY IN phpMyAdmin BEFORE using teacher features.
-- ============================================================

-- Teacher profiles (separate from parent users)
CREATE TABLE IF NOT EXISTS teachers (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  public_id       VARCHAR(36) NOT NULL UNIQUE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  school_name     VARCHAR(255) DEFAULT NULL,
  province        VARCHAR(50) DEFAULT NULL,
  verified        TINYINT(1) DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_teacher_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Classes managed by teachers
CREATE TABLE IF NOT EXISTS teacher_classes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id      INT NOT NULL,
  class_name      VARCHAR(100) NOT NULL,
  grade_level     VARCHAR(20) DEFAULT NULL,
  join_code       VARCHAR(6) NOT NULL UNIQUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_join_code (join_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Children enrolled in classes
CREATE TABLE IF NOT EXISTS class_enrollments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  class_id        INT NOT NULL,
  child_id        INT NOT NULL,
  enrolled_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  UNIQUE KEY uq_class_child (class_id, child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Teacher notes on students
CREATE TABLE IF NOT EXISTS teacher_notes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id      INT NOT NULL,
  child_id        INT NOT NULL,
  note_text       TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Teacher assignments
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id      INT NOT NULL,
  class_id        INT NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT DEFAULT NULL,
  game_id         VARCHAR(50) DEFAULT NULL,
  due_date        DATE DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES teacher_classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
