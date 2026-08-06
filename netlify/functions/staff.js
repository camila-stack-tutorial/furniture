const { getAuthedUser, role: roleOf } = require('./_auth');
const { woodoraStore } = require('./_store');

// Senior-admin-only: list the staff directory, and approve / revoke / promote / demote.
// Registration happens in auth-register.js; login happens in auth-login.js.

exports.handler = async (event) => {
  const user = await getAuthedUser(event);
  if (!user) return json(401, { error: 'Sign in required.' });
  if (roleOf(user) !== 'senior') return json(403, { error: 'Only a senior admin can view or manage staff.' });

  const store = woodoraStore();

  if (event.httpMethod === 'GET') {
    const directory = (await store.get('staff', { type: 'json' })) || [];
    // Never send password hashes to the client, even to a senior admin.
    const safe = directory.map(({ passwordHash, ...rest }) => rest);
    return json(200, { directory: safe });
  }

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch (e) { return json(400, { error: 'Invalid JSON body' }); }
    const { userId, action } = body; // 'approve' | 'revoke' | 'promote' | 'demote'

    const directory = (await store.get('staff', { type: 'json' })) || [];
    const idx = directory.findIndex(d => d.id === userId);
    if (idx < 0) return json(404, { error: 'Staff record not found.' });

    if (action === 'approve') directory[idx].status = 'approved';
    else if (action === 'revoke') directory[idx].status = 'revoked';
    else if (action === 'promote') directory[idx].role = 'senior';
    else if (action === 'demote') directory[idx].role = 'staff';
    else return json(400, { error: 'Unknown action.' });

    await store.setJSON('staff', directory);
    return json(200, { ok: true });
  }

  return json(405, { error: 'Method not allowed' });
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
}
