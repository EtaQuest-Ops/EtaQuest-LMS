// Run: node scripts/generate-password-hash.js "somePassword"
// Prints a hash in the "<salt_hex>:<sha256_hex>" format used by
// functions/_shared/crypto.js — paste the output into schema.sql
// or use it in a manual INSERT/UPDATE when adding real users.
const crypto = require("crypto");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node generate-password-hash.js <password>");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.createHash("sha256").update(salt + password).digest("hex");
console.log(`${salt}:${hash}`);
