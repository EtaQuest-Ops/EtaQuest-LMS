// functions/_shared/license.js
// Computes a human-readable license status from start/end dates.
// Pure date logic, no DB access — shared by every endpoint that
// needs to show or check a course's license state.

export function computeLicenseStatus(startDate, endDate) {
  if (!startDate && !endDate) {
    return { status: "unset", label: "No license period set", remainingDays: null };
  }

  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (start && now < start) {
    return { status: "upcoming", label: `License starts ${start.toISOString().slice(0, 10)}`, remainingDays: null };
  }

  if (end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const remainingDays = Math.ceil((end.getTime() - now.getTime()) / msPerDay);
    if (remainingDays < 0) {
      return { status: "expired", label: "License expired", remainingDays };
    }
    return { status: "active", label: `License expires in ${remainingDays} day${remainingDays === 1 ? "" : "s"}`, remainingDays };
  }

  return { status: "active", label: "License active (no expiry set)", remainingDays: null };
}
