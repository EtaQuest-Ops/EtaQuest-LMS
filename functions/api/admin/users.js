// GET  /api/admin/users — list all users. Admin-only.
// POST /api/admin/users — create a new user. Body: { name, email, password, role, schoolId }. Admin-only.
//
// Any non-admin caller gets a 403 here regardless of how the request was
// made — this endpoint doesn't trust anything about the caller except
// what getSessionUser resolves server-side from their session token.

import { getSessionUser, jsonResponse } from "../../_shared/auth.js";
import { hashPassword } from "../../_shared/crypto.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user || user.role !== "admin") return jsonResponse({ error: "Admins only" }, 403);

  const result = await env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.school_id, s.name AS school_name
     FROM users u LEFT JOIN schools s ON s.id = u.school_id
     ORDER BY u.name`
  ).all();

  return jsonResponse({ users: result.results });
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

  const { name, email, password, role, schoolId } = body;
  const validRoles = ["admin", "hod", "educator"];

  if (!name || !email || !password || !validRoles.includes(role)) {
    return jsonResponse({ error: "name, email, password, and a valid role are required" }, 400);
  }
  if (password.length < 8) {
    return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
  }
  if (role !== "admin" && !schoolId) {
    return jsonResponse({ error: "schoolId is required for hod and educator roles" }, 400);
  }

  const existing = await env.DB.prepare(`SELECT 1 FROM users WHERE lower(email) = lower(?)`).bind(email).first();
  if (existing) return jsonResponse({ error: "A user with that email already exists" }, 409);

  const id = `u-${crypto.randomUUID()}`;
  const passwordHash = await hashPassword(password);

  await env.DB.prepare(
    `INSERT INTO users (id, school_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, role === "admin" ? null : schoolId, name.trim(), email.trim().toLowerCase(), passwordHash, role).run();

  return jsonResponse({ ok: true, id });
}
