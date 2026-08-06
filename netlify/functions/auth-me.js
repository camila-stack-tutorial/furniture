const { getAuthedUser, isApproved } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const user = await getAuthedUser(event);
  if (!user || !isApproved(user)) return json(401, { error: 'Not signed in' });

  return json(200, { id: user.id, email: user.email, role: user.role });
};

function json(statusCode, data) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(data)
  };
}
