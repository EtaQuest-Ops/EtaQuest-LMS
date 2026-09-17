-- =========================================================
-- Migration: add lessons table (multiple embeds per curriculum)
-- Run this in the Cloudflare dashboard's D1 Console.
-- Safe to run on your live database — it only adds a new
-- table and one row, nothing existing is touched or dropped.
-- =========================================================

CREATE TABLE IF NOT EXISTS lessons (
  id         TEXT PRIMARY KEY,
  course_id  TEXT NOT NULL REFERENCES courses(id),
  title      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  embed_url  TEXT
);

INSERT INTO lessons (id, course_id, title, sort_order, embed_url) VALUES
  ('l-arduino-1', 'c-arduino-unoq', 'Introduction to Arduino Uno Q', 1,
   'https://www.canva.com/design/DAHBpZZuiF8/0Y1i7drzJuWZQ0s4YZlTZw/view?embed');
