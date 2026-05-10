DROP DATABASE IF EXISTS eventx;
CREATE DATABASE eventx;
USE eventx;

CREATE TABLE Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student','host','admin') DEFAULT 'student',
  department VARCHAR(100),
  year ENUM('FE','SE','TE','BE'),
  bio TEXT,
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date DATETIME NOT NULL,
  registration_deadline DATETIME,
  venue VARCHAR(200),
  category VARCHAR(100),
  max_participants INT DEFAULT 0,
  status ENUM(
    'draft',
    'pending_approval',
    'registration_open',
    'registration_closed',
    'ongoing',
    'completed'
  ) DEFAULT 'draft',
  approval_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  poster TEXT,
  timeline JSON,
  prize_pool VARCHAR(100),
  host_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES Users(id) ON DELETE SET NULL
);

CREATE TABLE Registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,

  ticket_id VARCHAR(50) UNIQUE,
  team_name VARCHAR(100),

  status ENUM('registered','cancelled','attended') DEFAULT 'registered',

  qr_code TEXT,

  score INT DEFAULT NULL,
  position VARCHAR(50) DEFAULT NULL,

  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE,

  UNIQUE KEY unique_registration (user_id,event_id)
);

CREATE TABLE Certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  position VARCHAR(50) DEFAULT 'Participant',
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE
);

CREATE TABLE Notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('info','warning','success','danger') DEFAULT 'info',
  icon VARCHAR(10),
  title VARCHAR(200),
  description TEXT,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE EventApprovals (
  id INT AUTO_INCREMENT PRIMARY KEY,

  event_id INT NOT NULL,
  host_id INT NOT NULL,
  admin_id INT,

  status ENUM('pending','approved','rejected') DEFAULT 'pending',

  admin_note TEXT,

  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,

  FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE,
  FOREIGN KEY (host_id) REFERENCES Users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES Users(id) ON DELETE SET NULL
);