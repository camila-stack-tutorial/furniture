const { getStore } = require('@netlify/blobs');
const { getAuthedUser, isApproved } = require('./_auth');
const seed = require('../../data/settings.json');

exports.handler = async (event) => {
  const store = getStore('woodora');

  if (event.httpMethod === 'GET') {
    const existing = await store.get('settings', { type: 'json' });
    return json(200, existing || seed);
  }

  if (event.httpMethod === 'POST') {
    const user = await getAuthedUser(event);
    if (!isApproved(user)) return json(401, { error: 'Not authorized. Sign in with an approved admin account.' });
    let body;
    try { body = JSON.parse(event.body); } catch (e) { return json(400, { error: 'Invalid JSON body' }); }
    await store.setJSON('settings', body);
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
