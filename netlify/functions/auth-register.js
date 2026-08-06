const crypto = require('crypto');
const { woodoraStore } = require('./_store');
const { hashPassword } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  let body;
  try { body = JSON.parse(event.body); } catch (e) { return json(400, { error: 'Invalid JSON body' }); }
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!name || !email || !password) return json(400, { error: 'Name, email and password are required.' });
  if (password.length < 8) return json(400, { error: 'Password must be at least 8 characters.' });

  const bootstrapEmail = (process.env.SENIOR_ADMIN_EMAIL || '').toLowerCase();
  if (bootstrapEmail && email === bootstrapEmail) {
    return json(400, { error: 'This email is reserved for the senior admin account — please log in instead.' });
  }

  const store = woodoraStore();
  const directory = (await store.get('staff', { type: 'json' })) || [];
  const existing = directory.find(d => d.email.toLowerCase() === email);
  if (existing) {
    if (existing.status === 'pending') return json(409, { error: 'You already requested access — waiting on senior admin approval.' });
    return json(409, { error: 'An account with this email already exists. Try logging in instead.' });
  }

  const record = {
    id: 'u' + crypto.randomBytes(8).toString('hex'),
    name,
    email,
    passwordHash: hashPassword(password),
    role: 'staff',
    status: 'pending',
    requestedAt: new Date().toISOString()
  };
  directory.push(record);
  await store.setJSON('staff', directory);

  return json(200, { ok: true, status: 'pending' });
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
}
