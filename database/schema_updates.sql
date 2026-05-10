

USE eventx;

ALTER TABLE Events
  ADD COLUMN registration_deadline DATETIME         AFTER date,
  ADD COLUMN status ENUM(
    'registration_open',
    'registration_closed',
    'ongoing',
    'completed'
  ) DEFAULT 'registration_open'                     AFTER registration_deadline,
  ADD COLUMN timeline JSON                          AFTER status;

CREATE TABLE IF NOT EXISTS Notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  type        ENUM('success','warning','info','danger') DEFAULT 'info',
  icon        VARCHAR(10)   DEFAULT '',
  title       VARCHAR(200)  NOT NULL,
  description TEXT,
  is_read     TINYINT(1)    DEFAULT 0,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

ALTER TABLE Users
  ADD COLUMN profile_pic VARCHAR(255) DEFAULT NULL AFTER year;

INSERT INTO Events (
  title, description, date, registration_deadline,
  venue, category, max_participants, status, timeline, created_by
) VALUES (
  'Dexterity 2K26 — Robotics Challenge',
  'Annual flagship robotics competition open to all engineering students.',
  DATE_ADD(NOW(), INTERVAL 3 DAY),
  DATE_ADD(NOW(), INTERVAL 1 DAY),
  'Main Auditorium, Block A',
  'Technical',
  200,
  'registration_open',
  JSON_ARRAY(
    JSON_OBJECT('label','Registration Opens',   'date', DATE_FORMAT(NOW(), '%Y-%m-%d'), 'done', true),
    JSON_OBJECT('label','Registration Deadline','date', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 DAY),'%Y-%m-%d'),'done',false),
    JSON_OBJECT('label','Preliminary Round',    'date', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 3 DAY),'%Y-%m-%d'),'done',false),
    JSON_OBJECT('label','Final Round',          'date', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 5 DAY),'%Y-%m-%d'),'done',false),
    JSON_OBJECT('label','Prize Distribution',   'date', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 6 DAY),'%Y-%m-%d'),'done',false)
  ),
  1
);

INSERT INTO Notifications (user_id, type, icon, title, description) VALUES
(1, 'success', '', 'Registration Confirmed',    'You are registered for Dexterity 2K26.'),
(1, 'warning', '⏰', 'Event Date Approaching',    'Dexterity 2K26 starts in 3 days. Prepare now!'),
(1, 'info',    '', 'Venue Update',              'Design Thinking Workshop moved to Seminar Hall 2.'),
(1, 'danger',  '', 'Registration Closing Soon', 'Only 24 hours left to register for CodeSprint!');

