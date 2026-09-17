-- Adds five more Arduino Uno Q lectures (sort_order 10-14).
-- Safe to run on the live database — only adds new rows.

INSERT INTO lessons (id, course_id, title, sort_order, embed_url) VALUES
  ('l-arduino-10', 'c-arduino-unoq', 'Introduction to Streamlit', 10,
   'https://www.canva.com/design/DAHDQpfqKLQ/MfZCceG2WJPddi5qBcN4Vg/view?embed'),
  ('l-arduino-11', 'c-arduino-unoq', 'Introduction to AI', 11,
   'https://www.canva.com/design/DAHDiooT91Q/Ab4F1b9eJFDUKtaG2mrd2w/view?embed'),
  ('l-arduino-12', 'c-arduino-unoq', 'Training Alon Edge Impulse', 12,
   'https://www.canva.com/design/DAHDoyrGX9E/Rg2VCaO0tmZvdpgt4wNAFA/view?embed'),
  ('l-arduino-13', 'c-arduino-unoq', 'Deploying Custom Models', 13,
   'https://www.canva.com/design/DAHDuq0cMxE/_kzOkANbrK6nj4b-7-fvwA/view?embed'),
  ('l-arduino-14', 'c-arduino-unoq', 'Adding Alarm system', 14,
   'https://www.canva.com/design/DAHD09yqsY4/3TDKAIPVpAo-EgH8hEBnnw/view?embed');
