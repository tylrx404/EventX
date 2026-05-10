

UPDATE Users SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSj5XFOjf' WHERE id = 3;
DELETE FROM Users WHERE id = 1;

UPDATE Users SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSj5XFOjf' WHERE id = 2;

ALTER TABLE Events 
  ADD COLUMN IF NOT EXISTS registration_deadline DATETIME NULL,
  ADD COLUMN IF NOT EXISTS status ENUM('registration_open','registration_closed','ongoing','completed') DEFAULT 'registration_open',
  ADD COLUMN IF NOT EXISTS timeline JSON NULL,
  ADD COLUMN IF NOT EXISTS poster VARCHAR(500) NULL;

CREATE TABLE IF NOT EXISTS Notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  type       VARCHAR(50) DEFAULT 'info',
  icon       VARCHAR(10) DEFAULT '',
  title      VARCHAR(200),
  description TEXT,
  is_read    TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fk_notif_user) (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

DELETE FROM Registrations;
DELETE FROM Events;

INSERT INTO Events (title, description, date, registration_deadline, venue, category, max_participants, status, poster) VALUES
(
  'Dexterity 2K26',
  'MMCOE flagship technical festival with robotics, coding competitions, and engineering challenges. Open to all branches.',
  '2026-04-15 09:00:00',
  '2026-04-10 23:59:00',
  'MMCOE Campus',
  'Technical',
  500,
  'registration_open',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'
),
(
  'Rang Tarang 2026',
  'Annual cultural festival celebrating art, music, dance and drama. Show your talent on the big stage.',
  '2026-03-28 10:00:00',
  '2026-03-25 23:59:00',
  'MMCOE Auditorium',
  'Cultural',
  300,
  'registration_open',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80'
),
(
  'AI/ML Workshop',
  'Hands-on workshop on Artificial Intelligence and Machine Learning fundamentals. Learn to train models using Python and TensorFlow.',
  '2026-04-05 10:00:00',
  '2026-04-02 23:59:00',
  'Computer Lab 3, MMCOE',
  'Workshop',
  60,
  'registration_open',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80'
),
(
  'Code Sprint Hackathon',
  '24-hour hackathon where teams build innovative solutions for real-world problems. Mentors from industry will guide you.',
  '2026-04-20 09:00:00',
  '2026-04-15 23:59:00',
  'MMCOE Campus',
  'Competitions',
  200,
  'registration_open',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80'
);

SELECT id, name, email, role FROM Users;
SELECT id, title, date, status FROM Events;