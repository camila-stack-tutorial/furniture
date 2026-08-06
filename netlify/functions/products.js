const { getAuthedUser, isApproved } = require('./_auth');
const { woodoraStore } = require('./_store');
const seed = require('../../data/products.json');

exports.handler = async (event) => {
  const store = woodoraStore();

  if (event.httpMethod === 'GET') {
    const existing = await store.get('products', { type: 'json' });
    return json(200, existing || seed);
  }

  if (event.httpMethod === 'POST') {
    const user = await getAuthedUser(event);
    if (!isApproved(user)) return json(401, { error: 'Not authorized. Sign in with an approved admin account.' });
    let body;
    try { body = JSON.parse(event.body); } catch (e) { return json(400, { error: 'Invalid JSON body' }); }
    if (!Array.isArray(body)) return json(400, { error: 'Expected an array of products' });
    await store.setJSON('products', body);
    return json(200, { ok: true, count: body.length });
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
