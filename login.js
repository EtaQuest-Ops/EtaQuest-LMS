// POST /api/login
// Body: { email, password }
// No school selection — the user's school comes from their DB row.

import { verifyPassword, generateToken } from "../_shared/crypto.js";
import { jsonResponse } from "../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return jsonResponse({ error: "Email and password are required" }, 400);
  }

  const user = await env.DB.prepare(
    `SELECT id, name, email, password_hash, role, school_id FROM users WHERE lower(email) = ?`
  ).bind(email).first();

  if (!user) {
    return jsonResponse({ error: "Invalid email or password" }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return jsonResponse({ error: "Invalid email or password" }, 401);
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 days

  await env.DB.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
  ).bind(token, user.id, expiresAt).run();

  // Record this login for the HOD "how many times have they signed in" report
  await env.DB.prepare(
    `INSERT INTO login_logs (user_id) VALUES (?)`
  ).bind(user.id).run();

  let school = null;
  if (user.school_id) {
    school = await env.DB.prepare(`SELECT * FROM schools WHERE id = ?`).bind(user.school_id).first();
  }

  return jsonResponse({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, schoolId: user.school_id },
    school
  });
}
