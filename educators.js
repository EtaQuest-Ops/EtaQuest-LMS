// GET /api/admin/educators?schoolId=...
// Admin-only. Basic educator list for a school (no progress/login stats —
// see /api/reports for the full HOD-style report).

import { getSessionUser, jsonResponse } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user || user.role !== "admin") return jsonResponse({ error: "Admins only" }, 403);

  const url = new URL(request.url);
  const schoolId = url.searchParams.get("schoolId");
  if (!schoolId) return jsonResponse({ error: "Missing schoolId" }, 400);

  const result = await env.DB.prepare(
    `SELECT id, name, email FROM users WHERE school_id = ? AND role = 'educator' ORDER BY name`
  ).bind(schoolId).all();

  return jsonResponse({ educators: result.results });
}
