// GET  /api/admin/license            — list every course with its license status. Admin or HOD.
//      HOD sees only courses licensed to their own school; Admin sees all.
// POST /api/admin/license             — Body: { courseId, startDate, endDate }. Admin-only.

import { getSessionUser, jsonResponse } from "../../_shared/auth.js";
import { computeLicenseStatus } from "../../_shared/license.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
  if (user.role !== "admin" && user.role !== "hod") {
    return jsonResponse({ error: "Only Admin and HOD can view license information" }, 403);
  }

  let coursesResult;
  if (user.role === "admin") {
    coursesResult = await env.DB.prepare(`SELECT * FROM courses ORDER BY title`).all();
  } else {
    coursesResult = await env.DB.prepare(
      `SELECT c.* FROM courses c
       JOIN school_courses sc ON sc.course_id = c.id AND sc.school_id = ?
       ORDER BY c.title`
    ).bind(user.schoolId).all();
  }

  const courses = coursesResult.results.map(c => ({
    id: c.id,
    title: c.title,
    ...computeLicenseStatus(c.license_start_date, c.license_end_date),
    startDate: c.license_start_date,
    endDate: c.license_end_date
  }));

  return jsonResponse({ courses });
}

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
  if (user.role !== "admin") {
    return jsonResponse({ error: "Only Admin can modify license information" }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { courseId, startDate, endDate } = body;
  if (!courseId) return jsonResponse({ error: "courseId is required" }, 400);

  await env.DB.prepare(
    `UPDATE courses SET license_start_date = ?, license_end_date = ? WHERE id = ?`
  ).bind(startDate || null, endDate || null, courseId).run();

  return jsonResponse({ ok: true });
}
