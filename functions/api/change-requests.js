// POST /api/change-requests
// Body: { courseId, lessonId (optional), pageNote (optional), requestText }
// Educator or HOD only. The course/lesson identifiers are validated
// server-side against what this user actually has access to — an
// educator can't file a request against a course they aren't assigned
// to, and a lesson must genuinely belong to the stated course.

import { getSessionUser, jsonResponse } from "../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
  if (user.role !== "educator" && user.role !== "hod") {
    return jsonResponse({ error: "Only educators and HODs can submit change requests" }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { courseId, lessonId, pageNote, requestText } = body;
  if (!courseId || !requestText || !requestText.trim()) {
    return jsonResponse({ error: "courseId and requestText are required" }, 400);
  }

  // Server-side access check — never trust the client's course/lesson claim.
  let hasAccess = false;
  if (user.role === "educator") {
    const row = await env.DB.prepare(
      `SELECT 1 FROM educator_courses WHERE user_id = ? AND course_id = ?`
    ).bind(user.id, courseId).first();
    hasAccess = !!row;
  } else {
    const row = await env.DB.prepare(
      `SELECT 1 FROM school_courses WHERE school_id = ? AND course_id = ?`
    ).bind(user.schoolId, courseId).first();
    hasAccess = !!row;
  }
  if (!hasAccess) return jsonResponse({ error: "You don't have access to this course" }, 403);

  if (lessonId) {
    const lessonRow = await env.DB.prepare(
      `SELECT 1 FROM lessons WHERE id = ? AND course_id = ?`
    ).bind(lessonId, courseId).first();
    if (!lessonRow) return jsonResponse({ error: "That lesson doesn't belong to the given course" }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO change_requests (user_id, course_id, lesson_id, page_note, request_text)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(user.id, courseId, lessonId || null, pageNote || null, requestText.trim()).run();

  return jsonResponse({ ok: true });
}
