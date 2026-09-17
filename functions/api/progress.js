// POST /api/progress
// Body: { courseId, modulesCompleted }
// Educator-only — updates their own progress on an assigned course.

import { getSessionUser, jsonResponse } from "../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
  if (user.role !== "educator") return jsonResponse({ error: "Only educators can update progress" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { courseId, modulesCompleted } = body;
  if (!courseId || typeof modulesCompleted !== "number") {
    return jsonResponse({ error: "courseId and modulesCompleted are required" }, 400);
  }

  const assigned = await env.DB.prepare(
    `SELECT 1 FROM educator_courses WHERE user_id = ? AND course_id = ?`
  ).bind(user.id, courseId).first();
  if (!assigned) return jsonResponse({ error: "You are not assigned to this course" }, 403);

  await env.DB.prepare(
    `INSERT INTO curriculum_progress (user_id, course_id, modules_completed, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, course_id)
     DO UPDATE SET modules_completed = excluded.modules_completed, updated_at = excluded.updated_at`
  ).bind(user.id, courseId, modulesCompleted).run();

  return jsonResponse({ ok: true });
}
