const { woodoraStore } = require('./_store');
const { signToken, verifyPasswordHash, safeEqual } = require('./_auth');

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try { body = JSON.parse(event.body); } catch (e) { return json(400, { error: 'Invalid JSON body' }); }
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!email || !password) return json(400, { error: 'Email and password are required.' });

  const store = woodoraStore();
  const attemptsKey = `login_fail:${email}`;
  const attempts = (await store.get(attemptsKey, { type: 'json' })) || { count: 0, lockedUntil: 0 };

  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    const mins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    return json(429, { error: `Too many failed attempts. Try again in ${mins} minute(s).` });
  }

  async function recordFailure() {
    attempts.count += 1;
    if (attempts.count >= MAX_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + LOCKOUT_MS;
      attempts.count = 0;
    }
    await store.setJSON(attemptsKey, attempts);
    return json(401, { error: 'Invalid email or password.' });
  }

  async function clearFailures() {
    try { await store.delete(attemptsKey); } catch (e) { /* fine if it never existed */ }
  }

  // Bootstrap senior admin — credentials live only in env vars, never in Blobs.
  const bootstrapEmail = (process.env.SENIOR_ADMIN_EMAIL || '').toLowerCase();
  const bootstrapPassword = process.env.SENIOR_ADMIN_PASSWORD || '';
  if (bootstrapEmail && email === bootstrapEmail) {
    if (!bootstrapPassword || !safeEqual(password, bootstrapPassword)) return recordFailure();
    await clearFailures();
    const token = signToken({ sub: 'bootstrap', email, role: 'senior' });
    return json(200, { token, email, role: 'senior' });
  }

  // Staff account — looked up in Blobs.
  const directory = (await store.get('staff', { type: 'json' })) || [];
  const record = directory.find(d => d.email.toLowerCase() === email);
  if (!record || !record.passwordHash) return recordFailure();
  if (!verifyPasswordHash(password, record.passwordHash)) return recordFailure();

  if (record.status === 'pending') return json(403, { error: 'Your account is still waiting on senior admin approval.' });
  if (record.status !== 'approved') return json(403, { error: 'This account no longer has access.' });

  await clearFailures();
  const token = signToken({ sub: record.id, email: record.email, role: record.role });
  return json(200, { token, email: record.email, role: record.role });
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
}
