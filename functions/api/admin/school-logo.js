// POST /api/admin/school-logo
// Body: { schoolId, logoUrl }. Admin-only.

import { getSessionUser, jsonResponse } from "../../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user || user.role !== "admin") return jsonResponse({ error: "Admins only" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const { schoolId, logoUrl } = body;
  if (!schoolId) return jsonResponse({ error: "schoolId is required" }, 400);

  await env.DB.prepare(`UPDATE schools SET logo_url = ? WHERE id = ?`).bind(logoUrl || null, schoolId).run();
  return jsonResponse({ ok: true });
}
