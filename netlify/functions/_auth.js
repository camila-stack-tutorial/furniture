// Shared auth helper. No third-party identity provider — sessions are
// signed tokens (HMAC-SHA256, JWT-shaped) verified with SESSION_SECRET,
// and staff passwords are hashed with scrypt (Node's built-in crypto,
// no extra dependency).
//
// Requires these Netlify environment variables:
//   SENIOR_ADMIN_EMAIL     - the permanent bootstrap senior admin's email
//   SENIOR_ADMIN_PASSWORD  - that account's password (plain, compared server-side only)
//   SESSION_SECRET         - long random string used to sign/verify tokens
//
// Two kinds of "user" this module can return from getAuthedUser():
//   { id: 'bootstrap', email, role: 'senior', status: 'approved' }
//   { id: '<staffId>', email, role: 'staff'|'senior', status: 'approved' }
// Everything downstream (products.js, settings.js, staff.js) only cares
// about role()/isApproved(), so their code doesn't need to change.

const crypto = require('crypto');

const SESSION_SECRET = process.env.SESSION_SECRET || '';
const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60; // 7 days

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function hmac(data) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function signToken(payload, expiresInSeconds = TOKEN_LIFETIME_SECONDS) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const headerB64 = base64url(JSON.stringify(header));
  const bodyB64 = base64url(JSON.stringify(body));
  const sig = hmac(`${headerB64}.${bodyB64}`);
  return `${headerB64}.${bodyB64}.${sig}`;
}

function verifyToken(token) {
  if (!token || !SESSION_SECRET) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, sig] = parts;
  const expectedSig = hmac(`${headerB64}.${bodyB64}`);
  if (!safeEqual(sig, expectedSig)) return null;
  let payload;
  try {
    payload = JSON.parse(base64urlDecode(bodyB64));
  } catch (e) {
    return null;
  }
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
  return payload;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPasswordHash(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const hashBuf = Buffer.from(hash, 'hex');
  const testBuf = crypto.scryptSync(password, salt, 64);
  if (hashBuf.length !== testBuf.length) return false;
  return crypto.timingSafeEqual(hashBuf, testBuf);
}

async function getAuthedUser(event) {
  const header = event.headers.authorization || event.headers.Authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) return null;

  if (payload.sub === 'bootstrap') {
    const bootstrapEmail = (process.env.SENIOR_ADMIN_EMAIL || '').toLowerCase();
    if (!bootstrapEmail || payload.email?.toLowerCase() !== bootstrapEmail) return null;
    return { id: 'bootstrap', email: payload.email, role: 'senior', status: 'approved' };
  }

  // Re-check live status/role in Blobs on every request, so a revoke
  // (or a demote) takes effect immediately instead of waiting for the
  // token to expire.
  const { woodoraStore } = require('./_store');
  const store = woodoraStore();
  const directory = (await store.get('staff', { type: 'json' })) || [];
  const record = directory.find(d => d.id === payload.sub);
  if (!record) return null;
  return { id: record.id, email: record.email, role: record.role, status: record.status };
}

function role(user) {
  return user?.role || null;
}

function isApproved(user) {
  return user?.status === 'approved' && (user?.role === 'senior' || user?.role === 'staff');
}

module.exports = {
  getAuthedUser,
  role,
  isApproved,
  signToken,
  verifyToken,
  hashPassword,
  verifyPasswordHash,
  safeEqual
};
