// =========================================================
// functions/_shared/auth.js
// Reads the "Authorization: Bearer <token>" header, checks it
// against the sessions table, and returns the user + school.
// Every protected API route calls this first.
// =========================================================

export async function getSessionUser(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const session = await env.DB.prepare(
    `SELECT s.user_id, s.expires_at, u.id, u.name, u.email, u.role, u.school_id
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`
  ).bind(token).first();

  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) return null;

  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    schoolId: session.school_id
  };
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
