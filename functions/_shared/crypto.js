// =========================================================
// functions/_shared/crypto.js
// Password hashing using the Web Crypto API (built into the
// Cloudflare Workers/Pages runtime — no external libraries).
//
// Stored format: "<salt_hex>:<sha256_hex>"
// This is a lightweight MVP scheme. If you want something
// stronger later, swap this for PBKDF2 (crypto.subtle also
// supports that) without changing anything else in the app.
// =========================================================

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return bufferToHex(digest);
}

export async function hashPassword(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bufferToHex(saltBytes);
  const hashHex = await sha256Hex(saltHex + password);
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [saltHex, expectedHex] = stored.split(":");
  const actualHex = await sha256Hex(saltHex + password);
  return actualHex === expectedHex;
}

export function generateToken() {
  return bufferToHex(crypto.getRandomValues(new Uint8Array(32)));
}