-- Batch migration for: lesson flags, course licensing, lesson plan/outline
-- embeds, school logos, and change requests. Safe to run on the live
-- database — only adds new tables/columns, nothing existing is touched.

ALTER TABLE schools ADD COLUMN logo_url TEXT;

ALTER TABLE courses ADD COLUMN image_url TEXT;
ALTER TABLE courses ADD COLUMN license_start_date TEXT;
ALTER TABLE courses ADD COLUMN license_end_date TEXT;

ALTER TABLE lessons ADD COLUMN lesson_plan_embed_url TEXT;
ALTER TABLE lessons ADD COLUMN outline_embed_url TEXT;

CREATE TABLE lesson_status (
  user_id      TEXT NOT NULL REFERENCES users(id),
  lesson_id    TEXT NOT NULL REFERENCES lessons(id),
  opened_at    TEXT,
  completed_at TEXT,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE change_requests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT NOT NULL REFERENCES users(id),
  course_id    TEXT NOT NULL REFERENCES courses(id),
  lesson_id    TEXT REFERENCES lessons(id),
  page_note    TEXT,
  request_text TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','rejected')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
