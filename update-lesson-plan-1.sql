-- Sets the lesson plan link for "Introduction to Arduino Uno Q" (l-arduino-1).
-- Safe to run on the live database.

UPDATE lessons
SET lesson_plan_url = 'https://docs.google.com/document/d/1QKu7fuDpCJuj3c2NPU1fT_KsU6R75FGr/export?format=docx'
WHERE id = 'l-arduino-1';
