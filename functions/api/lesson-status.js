// POST /api/lesson-status
// Body: { lessonId, action: "open" | "complete" | "uncomplete" }
// Educator-only (a lesson is "opened/completed" from the perspective of
// the educator viewing it in their classroom).
//
// "open"       — records opened_at the first time only (never overwritten).
// "complete"   — sets completed_at to now.
// "uncomplete" — clears completed_at (lets an educator correct a mistake).
//
// After any change, curriculum_progress.modules_completed for this
// user+course is recalculated from lesson_status — this is the only
// place that table is written now, so the two systems can't drift apart.

import { getSessionUser, jsonResponse } from "../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
  if (user.role !== "educator") return jsonResponse({ error: "Only educators can update lesson status" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { lessonId, action } = body;
  if (!lessonId || !["open", "complete", "uncomplete"].includes(action)) {
    return jsonResponse({ error: "lessonId and a valid action are required" }, 400);
  }

  const lesson = await env.DB.prepare(
    `SELECT l.course_id FROM lessons l
     JOIN educator_courses ec ON ec.course_id = l.course_id AND ec.user_id = ?
     WHERE l.id = ?`
  ).bind(user.id, lessonId).first();
  if (!lesson) return jsonResponse({ error: "You are not assigned to this lesson's course" }, 403);

  await env.DB.prepare(
    `INSERT INTO lesson_status (user_id, lesson_id, opened_at, completed_at) VALUES (?, ?, NULL, NULL)
     ON CONFLICT(user_id, lesson_id) DO NOTHING`
  ).bind(user.id, lessonId).run();

  if (action === "open") {
    await env.DB.prepare(
      `UPDATE lesson_status SET opened_at = COALESCE(opened_at, datetime('now'))
       WHERE user_id = ? AND lesson_id = ?`
    ).bind(user.id, lessonId).run();
  } else if (action === "complete") {
    await env.DB.prepare(
      `UPDATE lesson_status SET opened_at = COALESCE(opened_at, datetime('now')), completed_at = datetime('now')
       WHERE user_id = ? AND lesson_id = ?`
    ).bind(user.id, lessonId).run();
  } else if (action === "uncomplete") {
    await env.DB.prepare(
      `UPDATE lesson_status SET completed_at = NULL WHERE user_id = ? AND lesson_id = ?`
    ).bind(user.id, lessonId).run();
  }

  // Recompute the course-level progress from actual lesson completions —
  // single source of truth, no manual slider anymore.
  const counts = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM lessons WHERE course_id = ?) AS total_lessons,
       (SELECT COUNT(*) FROM lesson_status ls
          JOIN lessons l ON l.id = ls.lesson_id
          WHERE l.course_id = ? AND ls.user_id = ? AND ls.completed_at IS NOT NULL) AS completed_lessons`
  ).bind(lesson.course_id, lesson.course_id, user.id).first();

  await env.DB.prepare(
    `INSERT INTO curriculum_progress (user_id, course_id, modules_completed, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, course_id)
     DO UPDATE SET modules_completed = excluded.modules_completed, updated_at = excluded.updated_at`
  ).bind(user.id, lesson.course_id, counts.completed_lessons).run();

  return jsonResponse({ ok: true, completedLessons: counts.completed_lessons, totalLessons: counts.total_lessons });
}
