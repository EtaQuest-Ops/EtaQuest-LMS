// GET /api/course?id=...
import { getSessionUser, jsonResponse } from "../_shared/auth.js";
import { computeLicenseStatus } from "../_shared/license.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonResponse({ error: "Missing course id" }, 400);

  const course = await env.DB.prepare(`SELECT * FROM courses WHERE id = ?`).bind(id).first();
  if (!course) return jsonResponse({ error: "Course not found" }, 404);

  // Admin manages licenses, so admin is never locked out of content.
  const licenseStatus = computeLicenseStatus(course.license_start_date, course.license_end_date);
  const locked = licenseStatus.status === "expired" && user.role !== "admin";

  let lessonsResult;
  if (user.role === "educator") {
    lessonsResult = await env.DB.prepare(
      `SELECT l.id, l.title, l.sort_order, l.embed_url, l.lesson_plan_url, l.lesson_plan_embed_url, l.outline_embed_url,
              ls.opened_at, ls.completed_at
       FROM lessons l
       LEFT JOIN lesson_status ls ON ls.lesson_id = l.id AND ls.user_id = ?
       WHERE l.course_id = ? ORDER BY l.sort_order`
    ).bind(user.id, id).all();
  } else {
    lessonsResult = await env.DB.prepare(
      `SELECT id, title, sort_order, embed_url, lesson_plan_url, lesson_plan_embed_url, outline_embed_url
       FROM lessons WHERE course_id = ? ORDER BY sort_order`
    ).bind(id).all();
  }

  // Strip actual content server-side when locked — a locked course can't
  // be viewed by hitting the API directly either, not just via the UI.
  let lessons = lessonsResult.results;
  if (locked) {
    lessons = lessons.map(l => ({
      ...l,
      embed_url: null,
      lesson_plan_url: null,
      lesson_plan_embed_url: null,
      outline_embed_url: null
    }));
  }

  let progress = null;
  if (user.role === "educator") {
    const row = await env.DB.prepare(
      `SELECT modules_completed FROM curriculum_progress WHERE user_id = ? AND course_id = ?`
    ).bind(user.id, id).first();
    progress = row ? row.modules_completed : 0;
  }

  // License visibility: Admin and HOD only, per spec — educators aren't
  // shown licensing details, but everyone gets the `locked` boolean.
  let license = null;
  if (user.role === "admin" || user.role === "hod") {
    license = licenseStatus;
    license.startDate = course.license_start_date;
    license.endDate = course.license_end_date;
  }

  const totalLessons = lessons.length || course.total_modules;

  return jsonResponse({ course, lessons, progress, totalLessons, license, locked });
}
