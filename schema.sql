-- =========================================================
-- EtaQuest LMS — D1 Schema + Seed Data
-- Run with:
--   wrangler d1 execute etaquest-lms --file=./schema.sql
--   wrangler d1 execute etaquest-lms --file=./schema.sql --remote   (for production)
-- =========================================================

DROP TABLE IF EXISTS login_logs;
DROP TABLE IF EXISTS curriculum_progress;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS educator_courses;
DROP TABLE IF EXISTS school_courses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS schools;

-- ---------- Schools (whitelabel tenants) ----------
CREATE TABLE schools (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  short_name    TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  accent_color  TEXT NOT NULL,
  tagline       TEXT
);

-- ---------- Users ----------
-- role: 'admin' (EtaQuest super-admin, school_id NULL, sees all schools)
--       'hod'   (Head of Department, school_id required, sees reports only)
--       'educator' (school_id required, sees assigned courses)
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  school_id     TEXT REFERENCES schools(id),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,   -- format: "<salt_hex>:<sha256_hex>"
  role          TEXT NOT NULL CHECK (role IN ('admin','hod','educator')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- Sessions (simple token auth, not JWT) ----------
CREATE TABLE sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL
);

-- ---------- Courses = curricula ----------
CREATE TABLE courses (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  category      TEXT,
  summary       TEXT,
  total_modules INTEGER NOT NULL DEFAULT 10,
  embed_url     TEXT   -- <-- Canva smart-embed link goes here
);

-- ---------- Which courses each school is licensed for ----------
CREATE TABLE school_courses (
  school_id TEXT NOT NULL REFERENCES schools(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  PRIMARY KEY (school_id, course_id)
);

-- ---------- Which courses a specific educator teaches ----------
CREATE TABLE educator_courses (
  user_id   TEXT NOT NULL REFERENCES users(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  PRIMARY KEY (user_id, course_id)
);

-- ---------- Curriculum progress (feeds HOD reports) ----------
CREATE TABLE curriculum_progress (
  user_id           TEXT NOT NULL REFERENCES users(id),
  course_id         TEXT NOT NULL REFERENCES courses(id),
  modules_completed INTEGER NOT NULL DEFAULT 0,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, course_id)
);

-- ---------- Login history (feeds HOD reports) ----------
CREATE TABLE login_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL REFERENCES users(id),
  logged_in_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- Lessons (individual Canva embeds within a curriculum) ----------
-- A course/curriculum is made up of one or more lessons, each with its
-- own smart-embed link and optional lesson plan document. sort_order
-- controls display order in the UI.
CREATE TABLE lessons (
  id              TEXT PRIMARY KEY,
  course_id       TEXT NOT NULL REFERENCES courses(id),
  title           TEXT NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  embed_url       TEXT,
  lesson_plan_url TEXT   -- <-- link to the lesson plan Word doc goes here
);

-- =========================================================
-- SEED DATA
-- =========================================================

INSERT INTO schools (id, name, short_name, primary_color, accent_color, tagline) VALUES
  ('etaquest-demo',   'EtaQuest Demo Lab',              'EQ', '#053757', '#F8804C', 'The default EtaQuest experience'),
  ('alnoor-academy',  'Al Noor Academy',                'AN', '#274B3F', '#D9B25C', 'STEAM programme partner since 2024'),
  ('greenfield-intl', 'Greenfield International School','GI', '#3A2E52', '#5FB7A6', 'STEAM programme partner since 2025');

-- Real curricula
INSERT INTO courses (id, title, category, summary, total_modules, embed_url) VALUES
  ('c-arduino-unoq', 'Arduino Uno Q',        'Electronics & Programming', 'Hands-on electronics and coding using the Arduino Uno Q platform.', 12, NULL),
  ('c-nous-ai',      'Nous AI',              'Artificial Intelligence',   'Introductory AI concepts and applied machine learning activities.', 10, NULL),
  ('c-sharkbot',     'Acebott Sharkbot',     'Robotics',                  'Building and programming the Acebott Sharkbot platform.',            10, NULL),
  ('c-icbricks',     'ICBricks',             'Robotics & Construction',   'Modular robotics and construction-based engineering challenges.',    10, NULL);

-- Licensing: which schools get which curricula
INSERT INTO school_courses (school_id, course_id) VALUES
  ('etaquest-demo',   'c-arduino-unoq'), ('etaquest-demo',   'c-nous-ai'),
  ('etaquest-demo',   'c-sharkbot'),     ('etaquest-demo',   'c-icbricks'),
  ('alnoor-academy',  'c-arduino-unoq'), ('alnoor-academy',  'c-icbricks'),
  ('greenfield-intl', 'c-nous-ai'),      ('greenfield-intl', 'c-sharkbot');

-- ---------- Demo users ----------
-- All demo passwords are: "password123"
-- Hash format is salt:sha256(salt+password) — see functions/_shared/crypto.js
-- These hashes were generated with that exact algorithm for "password123".
INSERT INTO users (id, school_id, name, email, password_hash, role) VALUES
  ('u-admin',  NULL,               'Noor (Super Admin)', 'admin@etaquest.co',      '2f1029062c1b55d282018157e0728e1d:de6992d5a053db03a7fb905fb5517723c725c106cf9e0801dc9e7d23254f8e2e', 'admin'),
  ('u-hod-1',  'alnoor-academy',   'Layla Mansour',       'hod@alnoor.edu',         '5ea24e4bed7a4759c3e58d6fd160e7ce:224d023a3e935ed8fb2e94cb2d4b832670978814b94d84f7c22a539cf225effe', 'hod'),
  ('u-edu-1',  'alnoor-academy',   'Sarah Haddad',        'sarah@alnoor.edu',       '585d224b00b5bbaa7491bfb817e822e4:edadb9a6259967212c3aae26763a5780fb1a964f962b7c27a5899c2c71a67f5c', 'educator'),
  ('u-edu-2',  'greenfield-intl',  'James Whitfield',     'james@greenfield.edu',  '01be5467eeae8bec09cfedf5f2f252bb:fb72e7bca9d19e4fb4ce1d4e3dc9ee5ae68a9c56cd065c5a18756c4d7c243b14', 'educator');

-- Educator course assignments
INSERT INTO educator_courses (user_id, course_id) VALUES
  ('u-edu-1', 'c-arduino-unoq'), ('u-edu-1', 'c-icbricks'),
  ('u-edu-2', 'c-nous-ai'),      ('u-edu-2', 'c-sharkbot');

-- Sample progress + login history so the HOD report page has something to show
INSERT INTO curriculum_progress (user_id, course_id, modules_completed) VALUES
  ('u-edu-1', 'c-arduino-unoq', 7),
  ('u-edu-1', 'c-icbricks', 2),
  ('u-edu-2', 'c-nous-ai', 5),
  ('u-edu-2', 'c-sharkbot', 10);

INSERT INTO login_logs (user_id, logged_in_at) VALUES
  ('u-edu-1', datetime('now', '-6 days')),
  ('u-edu-1', datetime('now', '-3 days')),
  ('u-edu-1', datetime('now', '-1 days')),
  ('u-edu-2', datetime('now', '-9 days')),
  ('u-edu-2', datetime('now', '-2 days'));

-- First real lesson content
INSERT INTO lessons (id, course_id, title, sort_order, embed_url) VALUES
  ('l-arduino-1', 'c-arduino-unoq', 'Introduction to Arduino Uno Q', 1,
   'https://www.canva.com/design/DAHBpZZuiF8/0Y1i7drzJuWZQ0s4YZlTZw/view?embed'),
  ('l-arduino-2', 'c-arduino-unoq', 'Introduction to Arduino App Lab', 2,
   'https://www.canva.com/design/DAHB9zUg1bc/xmT3gTutDdXLiz1aqv1lcA/view?embed'),
  ('l-arduino-3', 'c-arduino-unoq', 'Buttons and Buzzers', 3,
   'https://www.canva.com/design/DAHCHybn4_k/A2x1aqSRCqS3_YByhM6Y4g/view?embed'),
  ('l-arduino-4', 'c-arduino-unoq', 'Traffic Light Sequence', 4,
   'https://www.canva.com/design/DAHCxWxt0J0/zZkJlaP9FroY_D7UDgjGLw/view?embed'),
  ('l-arduino-5', 'c-arduino-unoq', 'Using LDRs and Reading from them', 5,
   'https://www.canva.com/design/DAHCa3EFDy4/GAgVJAVvK3klOCIVCr0Ukw/view?embed'),
  ('l-arduino-6', 'c-arduino-unoq', 'Making a Night Light', 6,
   'https://www.canva.com/design/DAHC5DgRaqk/OeYi5YfQah7LQ-28osvZqA/view?embed'),
  ('l-arduino-7', 'c-arduino-unoq', 'Introduction to Python', 7,
   'https://www.canva.com/design/DAHDEBktyaw/ufnvIuJaHBBeG9AIpJ1tKA/view?embed'),
  ('l-arduino-8', 'c-arduino-unoq', 'Introduction to Bridge', 8,
   NULL),
  ('l-arduino-9', 'c-arduino-unoq', 'Linux CLI', 9,
   'https://www.canva.com/design/DAHDQAKSsWI/-zopFnfs9vwguOD0VBl4hA/view?embed'),
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
