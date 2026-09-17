/* =========================================================
   EtaQuest LMS — Frontend API client
   -----------------------------------------------------------
   Talks to the /api/* Pages Functions. Session token is kept
   in sessionStorage (cleared when the browser/tab closes —
   safer default for shared classroom computers).
   ========================================================= */

const EQ_TOKEN_KEY = "eq_token";

function eq_getToken() {
  return sessionStorage.getItem(EQ_TOKEN_KEY);
}

function eq_setToken(token) {
  sessionStorage.setItem(EQ_TOKEN_KEY, token);
}

function eq_clearToken() {
  sessionStorage.removeItem(EQ_TOKEN_KEY);
}

async function eq_apiFetch(path, options = {}) {
  const token = eq_getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
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
  const data = await eq_apiFetch(`/api/course?id=${encodeURIComponent(id)}`);
  return data;
}

async function eq_updateProgress(courseId, modulesCompleted) {
  return eq_apiFetch("/api/progress", {
    method: "POST",
    body: JSON.stringify({ courseId, modulesCompleted })
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

/* ---------- Whitelabel theming ---------- */

function eq_applyBranding(school) {
  if (!school) return;
  document.documentElement.style.setProperty("--brand-primary", school.primary_color);
  document.documentElement.style.setProperty("--brand-accent", school.accent_color);
  document.querySelectorAll("[data-brand-name]").forEach(el => (el.textContent = school.name));
  document.querySelectorAll("[data-brand-tagline]").forEach(el => (el.textContent = school.tagline || ""));
  document.querySelectorAll("[data-brand-mark]").forEach(el => (el.textContent = school.short_name));
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
