const { getAuthedUser, isApproved } = require('./_auth');
const { woodoraStore } = require('./_store');
const { logActivities } = require('./_activity');
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

    const previous = (await store.get('products', { type: 'json' })) || seed;
    await store.setJSON('products', body);
    await logActivities(store, user, diffProducts(previous, body));

    return json(200, { ok: true, count: body.length });
  }

  return json(405, { error: 'Method not allowed' });
};

// Builds human-readable "what changed" lines by comparing the previous and
// next product lists, so the activity log can say e.g. "updated price of
// 'Oak Sofa' from 500 to 550" instead of just "products saved".
function diffProducts(previous, next) {
  const prevMap = new Map(previous.map(p => [p.id, p]));
  const nextMap = new Map(next.map(p => [p.id, p]));
  const actions = [];
  const trackedFields = ['name', 'category', 'color', 'oldPrice', 'featured', 'description', 'details', 'images'];

  for (const [id, p] of nextMap) {
    const before = prevMap.get(id);
    if (!before) { actions.push(`added product "${p.name}"`); continue; }

    if (before.price !== p.price) {
      actions.push(`updated price of "${p.name}" from ${before.price} to ${p.price}`);
    }
    const changedFields = trackedFields.filter(f => JSON.stringify(before[f]) !== JSON.stringify(p[f]));
    if (changedFields.length) {
      actions.push(`updated ${changedFields.join(', ')} of "${p.name}"`);
    }
  }
  for (const [id, p] of prevMap) {
    if (!nextMap.has(id)) actions.push(`deleted product "${p.name}"`);
  }
  return actions;
}

function json(statusCode, data) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
}
