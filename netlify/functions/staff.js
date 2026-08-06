const { getStore } = require('@netlify/blobs');
const { getAuthedUser, role, clerk } = require('./_auth');

// Keeps a simple directory of everyone who has ever signed in, so the
// senior admin can see who's pending and approve/revoke access.
// Actual permission is stored on the Clerk user (publicMetadata.role).

exports.handler = async (event) => {
  const store = getStore('woodora');
  const user = await getAuthedUser(event);
  if (!user) return json(401, { error: 'Sign in required' });
  const callerRole = role(user);

  if (event.httpMethod === 'GET') {
    // Any signed-in user can register themselves as "pending" on first login.
    const directory = (await store.get('staff', { type: 'json' })) || [];
    const alreadyListed = directory.find(d => d.id === user.id);
    if (!alreadyListed) {
      directory.push({
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        requestedAt: new Date().toISOString()
      });
      await store.setJSON('staff', directory);
    }
    if (callerRole !== 'senior') return json(200, { self: { role: callerRole } });
    return json(200, { self: { role: callerRole }, directory });
  }

  if (event.httpMethod === 'POST') {
    if (callerRole !== 'senior') return json(403, { error: 'Only the senior admin can approve or revoke staff.' });
    let body;
    try { body = JSON.parse(event.body); } catch (e) { return json(400, { error: 'Invalid JSON' }); }
    const { userId, action } = body; // action: 'approve' | 'revoke'
    if (!clerk) return json(500, { error: 'Clerk secret key not configured on the server.' });
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role: action === 'approve' ? 'staff' : null }
    });
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
