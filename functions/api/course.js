// GET /api/course?id=...
import { getSessionUser, jsonResponse } from "../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonResponse({ error: "Missing course id" }, 400);

  const course = await env.DB.prepare(`SELECT * FROM courses WHERE id = ?`).bind(id).first();
  if (!course) return jsonResponse({ error: "Course not found" }, 404);

  const lessonsResult = await env.DB.prepare(
    `SELECT id, title, sort_order, embed_url, lesson_plan_url FROM lessons WHERE course_id = ? ORDER BY sort_order`
  ).bind(id).all();

  let progress = null;
  if (user.role === "educator") {
    const row = await env.DB.prepare(
      `SELECT modules_completed FROM curriculum_progress WHERE user_id = ? AND course_id = ?`
    ).bind(user.id, id).first();
    progress = row ? row.modules_completed : 0;
  }

  return jsonResponse({ course, lessons: lessonsResult.results, progress });
}
