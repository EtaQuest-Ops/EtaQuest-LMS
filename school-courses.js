// GET  /api/admin/school-courses?schoolId=...
//      Returns every course with a `licensed` boolean for that school.
// POST /api/admin/school-courses
//      Body: { schoolId, courseId, licensed }
//      Adds or removes the school_courses row accordingly.
// Admin-only.

import { getSessionUser, jsonResponse } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user || user.role !== "admin") return jsonResponse({ error: "Admins only" }, 403);

  const url = new URL(request.url);
  const schoolId = url.searchParams.get("schoolId");
  if (!schoolId) return jsonResponse({ error: "Missing schoolId" }, 400);

  const result = await env.DB.prepare(
    `SELECT c.id, c.title, c.category,
            EXISTS(SELECT 1 FROM school_courses sc WHERE sc.school_id = ? AND sc.course_id = c.id) AS licensed
     FROM courses c
     ORDER BY c.title`
  ).bind(schoolId).all();

  return jsonResponse({ courses: result.results.map(c => ({ ...c, licensed: !!c.licensed })) });
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

  const { schoolId, courseId, licensed } = body;
  if (!schoolId || !courseId || typeof licensed !== "boolean") {
    return jsonResponse({ error: "schoolId, courseId, and licensed are required" }, 400);
  }

  if (licensed) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO school_courses (school_id, course_id) VALUES (?, ?)`
    ).bind(schoolId, courseId).run();
  } else {
    await env.DB.prepare(
      `DELETE FROM school_courses WHERE school_id = ? AND course_id = ?`
    ).bind(schoolId, courseId).run();
    // Revoking a school's license also clears any individual educator
    // assignments for that course at that school, so access can't
    // linger for a course the school no longer has.
    await env.DB.prepare(
      `DELETE FROM educator_courses
       WHERE course_id = ? AND user_id IN (SELECT id FROM users WHERE school_id = ?)`
    ).bind(courseId, schoolId).run();
  }

  return jsonResponse({ ok: true });
}
