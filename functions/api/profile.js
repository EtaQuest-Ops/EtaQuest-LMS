// GET   /api/profile — returns the current user's own editable info.
// PATCH /api/profile — Body: { name?, newPassword? }. Only these two fields
//        are ever accepted. Role and school_id are never touched here —
//        there's no code path in this file that can write to either,
//        by design, regardless of what a request body contains.

import { getSessionUser, jsonResponse } from "../_shared/auth.js";
import { hashPassword } from "../_shared/crypto.js";

export async function onRequestGet({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

  const row = await env.DB.prepare(`SELECT name, email, role, school_id FROM users WHERE id = ?`).bind(user.id).first();
  return jsonResponse({ profile: row });
}

export async function onRequestPatch({ request, env }) {
  const user = await getSessionUser(request, env);
  if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const updates = [];
  const values = [];

  if (typeof body.name === "string" && body.name.trim()) {
    updates.push("name = ?");
    values.push(body.name.trim().slice(0, 200));
  }

  if (typeof body.newPassword === "string" && body.newPassword.length > 0) {
    if (body.newPassword.length < 8) {
      return jsonResponse({ error: "Password must be at least 8 characters" }, 400);
    }
    updates.push("password_hash = ?");
    values.push(await hashPassword(body.newPassword));
  }

  if (!updates.length) return jsonResponse({ error: "Nothing to update" }, 400);

  values.push(user.id);
  await env.DB.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();

  return jsonResponse({ ok: true });
}
