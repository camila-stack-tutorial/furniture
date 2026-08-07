const { getAuthedUser, isApproved } = require('./_auth');
const { woodoraStore } = require('./_store');
const { logActivity } = require('./_activity');
const seed = require('../../data/settings.json');

exports.handler = async (event) => {
  const store = woodoraStore();

  if (event.httpMethod === 'GET') {
    const existing = await store.get('settings', { type: 'json' });
    return json(200, existing || seed);
  }

  if (event.httpMethod === 'POST') {
    const user = await getAuthedUser(event);
    if (!isApproved(user)) return json(401, { error: 'Not authorized. Sign in with an approved admin account.' });
    let body;
    try { body = JSON.parse(event.body); } catch (e) { return json(400, { error: 'Invalid JSON body' }); }

    const previous = (await store.get('settings', { type: 'json' })) || seed;
    await store.setJSON('settings', body);

    const changedFields = Object.keys(body).filter(k => JSON.stringify(body[k]) !== JSON.stringify(previous[k]));
    if (changedFields.length) {
      await logActivity(store, user, `updated site settings (${changedFields.join(', ')})`);
    }

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
