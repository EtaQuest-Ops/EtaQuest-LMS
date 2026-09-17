// GET /api/schools
// Admin-only. Lists every school with how many courses each is licensed for.

import { getSessionUser, jsonResponse } from "../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
  if (user.role !== "admin") return jsonResponse({ error: "Admins only" }, 403);

  const result = await env.DB.prepare(
    `SELECT s.id, s.name,
            (SELECT COUNT(*) FROM school_courses sc WHERE sc.school_id = s.id) AS course_count
     FROM schools s
     ORDER BY s.name`
  ).all();

  return jsonResponse({ schools: result.results });
}
