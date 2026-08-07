const { getAuthedUser, role: roleOf } = require('./_auth');
const { woodoraStore } = require('./_store');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const user = await getAuthedUser(event);
  if (!user) return json(401, { error: 'Sign in required.' });
  if (roleOf(user) !== 'senior') return json(403, { error: 'Only a senior admin can view the activity log.' });

  const store = woodoraStore();
  const log = (await store.get('activity_log', { type: 'json' })) || [];
  return json(200, { log });
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
}
