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

/* ---------- Icon set ----------
   Small stroke-based icon library (Feather/Lucide-style paths),
   used everywhere via eq_icon('name', sizePx). Keeping this as one
   shared function means every page draws from the same set instead
   of each page inventing its own ad hoc glyphs. */
const EQ_ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M16 3.6c1.7.4 3 2 3 3.9s-1.3 3.5-3 3.9"/><path d="M21.5 20c0-3-2-5.5-4.8-6.3"/>',
  chart: '<path d="M4 20V10"/><path d="M11 20V4"/><path d="M18 20v-7"/><path d="M2.5 20h19"/>',
  shield: '<path d="M12 2.5 20 6v6c0 5-3.4 8.4-8 9.5-4.6-1.1-8-4.5-8-9.5V6l8-3.5Z"/><path d="m8.5 12 2.3 2.3L15.5 9.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H4a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.6V4a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.6 1H20a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1Z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.3 2.3L16 10"/>',
  xCircle: '<circle cx="12" cy="12" r="9"/><path d="m9.5 9.5 5 5"/><path d="m14.5 9.5-5 5"/>',
  externalLink: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  fileText: '<path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5.5Z"/><path d="M14 2.5V8h5"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  alertTriangle: '<path d="M10.3 3.9 2 19h20L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4"/><path d="M12 17h.01"/>',
  edit: '<path d="M12.5 5.5 18.5 11.5 8 22H2v-6L12.5 5.5Z"/><path d="m15.5 2.5 6 6"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  clipboard: '<rect x="6" y="4.5" width="12" height="17" rx="2"/><path d="M9 4.5V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/><path d="M9 11h6"/><path d="M9 15h6"/>',
  layers: '<path d="m12 2.5 9 5-9 5-9-5 9-5Z"/><path d="m3 12.5 9 5 9-5"/><path d="m3 17.5 9 5 9-5"/>',
  building: '<rect x="4" y="2.5" width="16" height="19" rx="1"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/><path d="M10 21.5v-4h4v4"/>'
};

function eq_icon(name, size) {
  const px = size || 18;
  const body = EQ_ICONS[name] || "";
  return `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* ---------- Avatar ----------
   Circular initials badge, used in sidebars and tables in place of
   a plain-text name. Color is derived deterministically from the
   name so the same person always gets the same color. */
function eq_avatar(name, size) {
  const px = size || 32;
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("") || "?";
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  const bg = `hsl(${hash}, 42%, 40%)`;
  return `<span class="eq-avatar" style="width:${px}px;height:${px}px;font-size:${Math.round(px * 0.4)}px;background:${bg};">${eq_escapeHtml(initials)}</span>`;
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

/* ---------- Shared chrome ---------- */

function eq_roleLabel(role) {
  return { admin: "Super Admin", hod: "Head of Department", educator: "Educator" }[role] || role;
}

// Fills in the #sidebar-footer element every page shares: avatar,
// name, role, a Profile link, and Log out. Keeps this identical
// everywhere instead of hand-duplicating it per page.
function eq_renderSidebarFooter(user) {
  const el = document.getElementById("sidebar-footer");
  if (!el) return;
  el.innerHTML = `
    <a href="profile.html" class="sidebar-user-row">
      ${eq_avatar(user.name, 34)}
      <div>
        <div class="user-name">${eq_escapeHtml(user.name)}</div>
        <div class="role-line">${eq_roleLabel(user.role)}</div>
      </div>
    </a>
    <div class="sidebar-actions">
      <a href="profile.html" class="btn btn-ghost btn-sm btn-block" style="text-decoration:none;">${eq_icon("user", 15)} Profile</a>
      <button class="btn btn-ghost btn-sm btn-block" onclick="eq_logout()">${eq_icon("logout", 15)} Log out</button>
    </div>
  `;
}

// Fills in the #topbar-right utility cluster (search + notification
// bell). Both are visual placeholders — no backing functionality yet.
function eq_renderTopbarUtilities(targetId) {
  const el = document.getElementById(targetId || "topbar-utilities");
  if (!el) return;
  el.innerHTML = `
    <div class="topbar-search">${eq_icon("search", 15)} <span>Search…</span></div>
    <button class="icon-btn" title="Notifications" disabled>${eq_icon("bell", 17)}<span class="dot"></span></button>
  `;
}
