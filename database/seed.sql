USE eventx;

INSERT INTO Users (name, email, password, role, department) VALUES
('Admin', 'admin@mmcoe.edu.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSj5XFOjf', 'admin', 'Administration');

INSERT INTO Users (name, email, password, role, department, year) VALUES
('Vedant Kulkarni', 'vedant@mmcoe.edu.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSj5XFOjf', 'student', 'Computer Engineering', 'TE');

INSERT INTO Events (title, description, date, registration_deadline, venue, category, max_participants, status, poster, timeline) VALUES
(
  'Dexterity 2K26',
  'MMCOE flagship technical festival with robotics, coding competitions, and engineering challenges. Open to all branches.',
  DATE_ADD(NOW(), INTERVAL 15 DAY),
  DATE_ADD(NOW(), INTERVAL 10 DAY),
  'MMCOE Campus, Karvenagar',
  'Technical',
  500,
  'registration_open',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
  JSON_ARRAY(
    JSON_OBJECT('label','Registration Opens','done',true),
    JSON_OBJECT('label','Registration Deadline','done',false),
    JSON_OBJECT('label','Preliminary Round','done',false),
    JSON_OBJECT('label','Final Round','done',false),
    JSON_OBJECT('label','Prize Distribution','done',false)
  )
),
(
  'Rang Tarang 2026',
  'Annual cultural festival celebrating art, music, dance and drama. Show your talent on the big stage.',
  DATE_ADD(NOW(), INTERVAL 20 DAY),
  DATE_ADD(NOW(), INTERVAL 15 DAY),
  'MMCOE Auditorium',
  'Cultural',
  300,
  'registration_open',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80',
  JSON_ARRAY(
    JSON_OBJECT('label','Registration Opens','done',true),
    JSON_OBJECT('label','Audition Round','done',false),
    JSON_OBJECT('label','Final Performance','done',false),
    JSON_OBJECT('label','Prize Distribution','done',false)
  )
),
(
  'AI/ML Workshop',
  'Hands-on workshop on Artificial Intelligence and Machine Learning. Learn to train models using Python and TensorFlow.',
  DATE_ADD(NOW(), INTERVAL 7 DAY),
  DATE_ADD(NOW(), INTERVAL 5 DAY),
  'Computer Lab 3, MMCOE',
  'Workshop',
  60,
  'registration_open',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80',
  JSON_ARRAY(
    JSON_OBJECT('label','Registration Opens','done',true),
    JSON_OBJECT('label','Pre-Workshop Material','done',false),
    JSON_OBJECT('label','Workshop Day','done',false)
  )
),
(
  'Code Sprint Hackathon',
  '24-hour hackathon where teams build innovative solutions. Industry mentors will guide you throughout.',
  DATE_ADD(NOW(), INTERVAL 25 DAY),
  DATE_ADD(NOW(), INTERVAL 20 DAY),
  'MMCOE Campus',
  'Competitions',
  200,
  'registration_open',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80',
  JSON_ARRAY(
    JSON_OBJECT('label','Registration Opens','done',true),
    JSON_OBJECT('label','Team Formation','done',false),
    JSON_OBJECT('label','Hackathon Day 1','done',false),
    JSON_OBJECT('label','Hackathon Day 2','done',false),
    JSON_OBJECT('label','Presentations','done',false)
  )
);

INSERT INTO Notifications (user_id, type, icon, title, description) VALUES
(2, 'info',    '', 'Welcome to MMCOE Event Portal', 'Browse and register for upcoming events on campus.'),
(2, 'warning', '⏰', 'AI/ML Workshop — Registrations Closing', 'Only 5 days left to register for the AI/ML Workshop!'),
(2, 'info',    '', 'Dexterity 2K26 — Registration Open', 'Register now for MMCOE flagship technical festival.');