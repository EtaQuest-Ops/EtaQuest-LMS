// GET /api/reports?schoolId=... (schoolId only used/allowed for admin preview)
// HOD: sees educators at their own school.
// Admin: sees educators at whichever school they're previewing.
// Educators get a 403 — reports are management-only.

import { getSessionUser, jsonResponse } from "../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
  if (user.role !== "hod" && user.role !== "admin") {
    return jsonResponse({ error: "Reports are only available to Heads of Department and Admins" }, 403);
  }

  const url = new URL(request.url);
  const previewSchoolId = url.searchParams.get("schoolId");
  const schoolId = user.role === "admin" ? previewSchoolId : user.schoolId;
  if (!schoolId) return jsonResponse({ educators: [] });

  const educatorsResult = await env.DB.prepare(
    `SELECT id, name, email FROM users WHERE school_id = ? AND role = 'educator' ORDER BY name`
  ).bind(schoolId).all();
  const educators = educatorsResult.results;

  for (const educator of educators) {
    const courseRows = await env.DB.prepare(
      `SELECT c.title, c.total_modules, COALESCE(cp.modules_completed, 0) AS modules_completed, cp.updated_at
       FROM educator_courses ec
       JOIN courses c ON c.id = ec.course_id
       LEFT JOIN curriculum_progress cp ON cp.course_id = c.id AND cp.user_id = ec.user_id
       WHERE ec.user_id = ?`
    ).bind(educator.id).all();
    educator.courses = courseRows.results;

    const loginStats = await env.DB.prepare(
      `SELECT COUNT(*) AS login_count, MAX(logged_in_at) AS last_login
       FROM login_logs WHERE user_id = ?`
    ).bind(educator.id).first();
    educator.loginCount = loginStats.login_count;
    educator.lastLogin = loginStats.last_login;
  }

  return jsonResponse({ educators });
}
