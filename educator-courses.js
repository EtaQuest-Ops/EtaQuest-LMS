// GET  /api/admin/educator-courses?userId=...
//      Returns the courses licensed to that educator's school, each with
//      an `assigned` boolean for this specific educator.
// POST /api/admin/educator-courses
//      Body: { userId, courseId, assigned }
// Admin-only.

import { getSessionUser, jsonResponse } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user || user.role !== "admin") return jsonResponse({ error: "Admins only" }, 403);

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return jsonResponse({ error: "Missing userId" }, 400);

  const educator = await env.DB.prepare(`SELECT school_id FROM users WHERE id = ?`).bind(userId).first();
  if (!educator) return jsonResponse({ error: "Educator not found" }, 404);

  const result = await env.DB.prepare(
    `SELECT c.id, c.title, c.category,
            EXISTS(SELECT 1 FROM educator_courses ec WHERE ec.user_id = ? AND ec.course_id = c.id) AS assigned
     FROM courses c
     JOIN school_courses sc ON sc.course_id = c.id AND sc.school_id = ?
     ORDER BY c.title`
  ).bind(userId, educator.school_id).all();

  return jsonResponse({ courses: result.results.map(c => ({ ...c, assigned: !!c.assigned })) });
}

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user || user.role !== "admin") return jsonResponse({ error: "Admins only" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { userId, courseId, assigned } = body;
  if (!userId || !courseId || typeof assigned !== "boolean") {
    return jsonResponse({ error: "userId, courseId, and assigned are required" }, 400);
  }

  if (assigned) {
    // Guard: only allow assigning courses the educator's school is actually licensed for
    const licensed = await env.DB.prepare(
      `SELECT 1 FROM school_courses sc
       JOIN users u ON u.school_id = sc.school_id
       WHERE u.id = ? AND sc.course_id = ?`
    ).bind(userId, courseId).first();
    if (!licensed) return jsonResponse({ error: "This course isn't licensed to the educator's school" }, 400);

    await env.DB.prepare(
      `INSERT OR IGNORE INTO educator_courses (user_id, course_id) VALUES (?, ?)`
    ).bind(userId, courseId).run();
  } else {
    await env.DB.prepare(
      `DELETE FROM educator_courses WHERE user_id = ? AND course_id = ?`
    ).bind(userId, courseId).run();
  }

  return jsonResponse({ ok: true });
}
