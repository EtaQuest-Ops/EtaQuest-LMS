/* =========================================================
   EtaQuest LMS — Frontend API client
   -----------------------------------------------------------
   Talks to the /api/* Pages Functions. Session token is kept
   in localStorage — shared across all tabs/windows of the same
   origin, unlike sessionStorage, which is what caused lectures
   opened via Ctrl/Cmd+click or "open in new tab" to lose their
   session and bounce to the login page (see the note at the
   bottom of this file for the full explanation).
   ========================================================= */

const EQ_TOKEN_KEY = "eq_token";

function eq_getToken() {
  return localStorage.getItem(EQ_TOKEN_KEY);
}

function eq_setToken(token) {
  localStorage.setItem(EQ_TOKEN_KEY, token);
}

function eq_clearToken() {
  localStorage.removeItem(EQ_TOKEN_KEY);
}

// One-time cleanup: earlier versions of this app stored the token in
// sessionStorage. If a stale one is sitting there, it's harmless but
// unused now — remove it so it can't cause confusion.
try { sessionStorage.removeItem(EQ_TOKEN_KEY); } catch {}

async function eq_apiFetch(path, options = {}) {
  const token = eq_getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

/* ---------- HTML escaping ----------
   Used whenever we inject a value that ultimately came from user
   input (a name, a request comment) into innerHTML. */
function eq_escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- Auth ---------- */

async function eq_login(email, password) {
  const data = await eq_apiFetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  eq_setToken(data.token);
  return data;
}

async function eq_me(previewSchoolId) {
  const qs = previewSchoolId ? `?schoolId=${encodeURIComponent(previewSchoolId)}` : "";
  return eq_apiFetch(`/api/me${qs}`);
}

async function eq_logout() {
  try {
    await eq_apiFetch("/api/logout", { method: "POST" });
  } catch {
    // ignore network errors on logout — clear locally regardless
  }
  eq_clearToken();
  window.location.href = "index.html";
}

/* ---------- Courses ---------- */

async function eq_getCourses(previewSchoolId) {
  const qs = previewSchoolId ? `?schoolId=${encodeURIComponent(previewSchoolId)}` : "";
  const data = await eq_apiFetch(`/api/courses${qs}`);
  return data.courses;
}

async function eq_getCourse(id) {
  return eq_apiFetch(`/api/course?id=${encodeURIComponent(id)}`);
}

/* ---------- Lesson open/complete tracking ---------- */

async function eq_setLessonStatus(lessonId, action) {
  return eq_apiFetch("/api/lesson-status", {
    method: "POST",
    body: JSON.stringify({ lessonId, action })
  });
}

/* ---------- Admin / HOD ---------- */

async function eq_getSchools() {
  const data = await eq_apiFetch("/api/schools");
  return data.schools;
}

async function eq_getReports(previewSchoolId) {
  const qs = previewSchoolId ? `?schoolId=${encodeURIComponent(previewSchoolId)}` : "";
  const data = await eq_apiFetch(`/api/reports${qs}`);
  return data.educators;
}

/* ---------- Admin: course access management ---------- */

async function eq_getSchoolCourses(schoolId) {
  const data = await eq_apiFetch(`/api/admin/school-courses?schoolId=${encodeURIComponent(schoolId)}`);
  return data.courses;
}

async function eq_setSchoolCourse(schoolId, courseId, licensed) {
  return eq_apiFetch("/api/admin/school-courses", {
    method: "POST",
    body: JSON.stringify({ schoolId, courseId, licensed })
  });
}

async function eq_getSchoolEducators(schoolId) {
  const data = await eq_apiFetch(`/api/admin/educators?schoolId=${encodeURIComponent(schoolId)}`);
  return data.educators;
}

async function eq_getEducatorCourses(userId) {
  const data = await eq_apiFetch(`/api/admin/educator-courses?userId=${encodeURIComponent(userId)}`);
  return data.courses;
}

async function eq_setEducatorCourse(userId, courseId, assigned) {
  return eq_apiFetch("/api/admin/educator-courses", {
    method: "POST",
    body: JSON.stringify({ userId, courseId, assigned })
  });
}

async function eq_setSchoolLogo(schoolId, logoUrl) {
  return eq_apiFetch("/api/admin/school-logo", {
    method: "POST",
    body: JSON.stringify({ schoolId, logoUrl })
  });
}

/* ---------- Licensing ---------- */

async function eq_getLicenses() {
  const data = await eq_apiFetch("/api/admin/license");
  return data.courses;
}

async function eq_setLicense(courseId, startDate, endDate) {
  return eq_apiFetch("/api/admin/license", {
    method: "POST",
    body: JSON.stringify({ courseId, startDate, endDate })
  });
}

/* ---------- Change requests ---------- */

async function eq_submitChangeRequest({ courseId, lessonId, pageNote, requestText }) {
  return eq_apiFetch("/api/change-requests", {
    method: "POST",
    body: JSON.stringify({ courseId, lessonId, pageNote, requestText })
  });
}

async function eq_getChangeRequests() {
  const data = await eq_apiFetch("/api/admin/change-requests");
  return data.requests;
}

async function eq_setChangeRequestStatus(id, status) {
  return eq_apiFetch("/api/admin/change-requests", {
    method: "POST",
    body: JSON.stringify({ id, status })
  });
}

/* ---------- Profile ---------- */

async function eq_getProfile() {
  const data = await eq_apiFetch("/api/profile");
  return data.profile;
}

async function eq_updateProfile(updates) {
  return eq_apiFetch("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
}

/* ---------- Admin: user management ---------- */

async function eq_getUsers() {
  const data = await eq_apiFetch("/api/admin/users");
  return data.users;
}

async function eq_createUser(user) {
  return eq_apiFetch("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(user)
  });
}

/* ---------- Whitelabel theming ---------- */

function eq_applyBranding(school) {
  if (!school) return;
  document.documentElement.style.setProperty("--brand-primary", school.primary_color);
  document.documentElement.style.setProperty("--brand-accent", school.accent_color);
  document.querySelectorAll("[data-brand-name]").forEach(el => (el.textContent = school.name));
  document.querySelectorAll("[data-brand-tagline]").forEach(el => (el.textContent = school.tagline || ""));
  document.querySelectorAll("[data-brand-mark]").forEach(el => (el.textContent = school.short_name));
  // A school with its own logo overrides the default EtaQuest icon in the sidebar badge.
  document.querySelectorAll(".brand-mark img").forEach(img => {
    img.src = school.logo_url || "assets/etaquest-logo-icon.jpg";
  });
}

/* ---------- Page guard ----------
   Call at the top of any protected page. Redirects to login if
   the session is invalid/expired, and applies branding for you. */
async function eq_requireSession(previewSchoolId) {
  try {
    const data = await eq_me(previewSchoolId);
    if (data.school) eq_applyBranding(data.school);
    return data;
  } catch (err) {
    window.location.href = "index.html";
    throw err;
  }
}
