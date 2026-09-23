-- Adds the first Nous AI lecture. No Canva embed link yet (embed_url is
-- NULL, shows the "not linked yet" placeholder) — send that whenever
-- you have it and it's a one-line UPDATE, same as the lesson plan below.

INSERT INTO lessons (id, course_id, title, sort_order, embed_url, lesson_plan_url) VALUES
  ('l-nousai-1', 'c-nous-ai', 'Introduction to Nous AI', 1, NULL,
   'https://docs.google.com/document/d/1QKu7fuDpCJuj3c2NPU1fT_KsU6R75FGr/export?format=docx');
