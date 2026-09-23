// GET /api/courses?schoolId=... (schoolId only used/allowed for admin preview)
// Educators: their assigned courses within their school, with their own progress.
// HOD: the full licensed catalog for their school (context only; reports.html has the real data).
// Admin: the licensed catalog for whichever school they're previewing.

import { getSessionUser, jsonResponse } from "../_shared/auth.js";
import { computeLicenseStatus } from "../_shared/license.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

  const url = new URL(request.url);
  const previewSchoolId = url.searchParams.get("schoolId");
  const schoolId = user.role === "admin" ? previewSchoolId : user.schoolId;

  if (!schoolId) return jsonResponse({ courses: [] });

  if (user.role === "educator") {
    const result = await env.DB.prepare(
      `SELECT c.*, COALESCE(cp.modules_completed, 0) AS modules_completed
       FROM courses c
       JOIN school_courses sc ON sc.course_id = c.id AND sc.school_id = ?
       JOIN educator_courses ec ON ec.course_id = c.id AND ec.user_id = ?
       LEFT JOIN curriculum_progress cp ON cp.course_id = c.id AND cp.user_id = ?
       ORDER BY c.title`
    ).bind(schoolId, user.id, user.id).all();
    return jsonResponse({ courses: result.results });
  }

  // admin / hod — full licensed catalog for the school, no personal progress,
  // with license status attached (visible to these two roles per spec)
  const result = await env.DB.prepare(
    `SELECT c.* FROM courses c
     JOIN school_courses sc ON sc.course_id = c.id AND sc.school_id = ?
     ORDER BY c.title`
  ).bind(schoolId).all();

  const courses = result.results.map(c => ({
    ...c,
    license: computeLicenseStatus(c.license_start_date, c.license_end_date)
  }));

  return jsonResponse({ courses });
}
