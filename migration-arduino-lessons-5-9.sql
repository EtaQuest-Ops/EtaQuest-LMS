-- Adds five more Arduino Uno Q lectures (sort_order 5-9), continuing after
-- the existing four. Lecture 8 ("Introduction to Bridge") has no Canva link
-- yet, so embed_url is left NULL — it'll show the "not linked yet" placeholder
-- on the course page until you send me the link to fill in.

INSERT INTO lessons (id, course_id, title, sort_order, embed_url) VALUES
  ('l-arduino-5', 'c-arduino-unoq', 'Using LDRs and Reading from them', 5,
   'https://www.canva.com/design/DAHCa3EFDy4/GAgVJAVvK3klOCIVCr0Ukw/view?embed'),
  ('l-arduino-6', 'c-arduino-unoq', 'Making a Night Light', 6,
   'https://www.canva.com/design/DAHC5DgRaqk/OeYi5YfQah7LQ-28osvZqA/view?embed'),
  ('l-arduino-7', 'c-arduino-unoq', 'Introduction to Python', 7,
   'https://www.canva.com/design/DAHDEBktyaw/ufnvIuJaHBBeG9AIpJ1tKA/view?embed'),
  ('l-arduino-8', 'c-arduino-unoq', 'Introduction to Bridge', 8,
   NULL),
  ('l-arduino-9', 'c-arduino-unoq', 'Linux CLI', 9,
   'https://www.canva.com/design/DAHDQAKSsWI/-zopFnfs9vwguOD0VBl4hA/view?embed');
