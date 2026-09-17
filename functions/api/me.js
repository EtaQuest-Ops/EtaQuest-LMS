// GET /api/me
// Validates the session token and returns who's logged in.
// Admins have no fixed school — pass ?schoolId= to preview one
// (used by the admin dashboard's in-page school switcher).

import { getSessionUser, jsonResponse } from "../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

  let school = null;
  const url = new URL(request.url);
  const previewSchoolId = url.searchParams.get("schoolId");

  const effectiveSchoolId = user.schoolId || previewSchoolId;
  if (effectiveSchoolId) {
    school = await env.DB.prepare(`SELECT * FROM schools WHERE id = ?`).bind(effectiveSchoolId).first();
  }

  let schools = null;
  if (user.role === "admin") {
    const result = await env.DB.prepare(`SELECT * FROM schools ORDER BY name`).all();
    schools = result.results;
  }

  return jsonResponse({ user, school, schools });
}
