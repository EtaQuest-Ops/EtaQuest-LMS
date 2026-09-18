// GET  /api/admin/change-requests           — Admin-only. Lists every request.
// POST /api/admin/change-requests           — Body: { id, status }. Admin-only, updates status.

import { getSessionUser, jsonResponse } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user || user.role !== "admin") return jsonResponse({ error: "Admins only" }, 403);

  const result = await env.DB.prepare(
    `SELECT cr.id, cr.request_text, cr.page_note, cr.status, cr.created_at,
            u.name AS user_name, u.role AS user_role,
            c.title AS course_title,
            l.title AS lesson_title
     FROM change_requests cr
     JOIN users u ON u.id = cr.user_id
     JOIN courses c ON c.id = cr.course_id
     LEFT JOIN lessons l ON l.id = cr.lesson_id
     ORDER BY cr.created_at DESC`
  ).all();

  return jsonResponse({ requests: result.results });
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

  const { id, status } = body;
  const validStatuses = ["pending", "reviewed", "resolved", "rejected"];
  if (!id || !validStatuses.includes(status)) {
    return jsonResponse({ error: "id and a valid status are required" }, 400);
  }

  await env.DB.prepare(`UPDATE change_requests SET status = ? WHERE id = ?`).bind(status, id).run();
  return jsonResponse({ ok: true });
}
