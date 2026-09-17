-- Adds a place to store each lesson's lesson-plan document link.
-- Safe to run on the live database — only adds a new column,
-- existing rows get NULL (shown as "not yet uploaded" in the UI).

ALTER TABLE lessons ADD COLUMN lesson_plan_url TEXT;
