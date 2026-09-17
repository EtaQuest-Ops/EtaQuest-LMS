-- Adds three more Arduino Uno Q lectures, after the existing one (sort_order 1).
-- Safe to run on the live database — only adds new rows.

INSERT INTO lessons (id, course_id, title, sort_order, embed_url) VALUES
  ('l-arduino-2', 'c-arduino-unoq', 'Introduction to Arduino App Lab', 2,
   'https://www.canva.com/design/DAHB9zUg1bc/xmT3gTutDdXLiz1aqv1lcA/view?embed'),
  ('l-arduino-3', 'c-arduino-unoq', 'Buttons and Buzzers', 3,
   'https://www.canva.com/design/DAHCHybn4_k/A2x1aqSRCqS3_YByhM6Y4g/view?embed'),
  ('l-arduino-4', 'c-arduino-unoq', 'Traffic Light Sequence', 4,
   'https://www.canva.com/design/DAHCxWxt0J0/zZkJlaP9FroY_D7UDgjGLw/view?embed');
