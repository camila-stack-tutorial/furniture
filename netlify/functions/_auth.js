// Shared helper used by every protected function.
// Verifies the Clerk session token sent as "Authorization: Bearer <token>"
// and returns the signed-in user, or null if the token is missing/invalid.
//
// Requires these Netlify environment variables to be set:
//   CLERK_SECRET_KEY            - from your Clerk dashboard (API Keys)
//   CLERK_SENIOR_ADMIN_EMAIL    - the one email allowed to approve/revoke staff

const { createClerkClient } = require('@clerk/backend');

const clerk = process.env.CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  : null;

async function getAuthedUser(event) {
  const header = event.headers.authorization || event.headers.Authorization;
  if (!header || !header.startsWith('Bearer ') || !clerk) return null;
  const token = header.slice(7);
  try {
    const { payload } = await clerk.verifyToken(token);
    const user = await clerk.users.getUser(payload.sub);
    return user;
  } catch (e) {
    return null;
  }
}

function role(user) {
  if (!user) return null;
  if (user.emailAddresses?.[0]?.emailAddress?.toLowerCase() === (process.env.CLERK_SENIOR_ADMIN_EMAIL || '').toLowerCase()) {
    return 'senior';
  }
  return user.publicMetadata?.role || null; // 'staff' once approved by the senior admin
}

function isApproved(user) {
  const r = role(user);
  return r === 'senior' || r === 'staff';
}

module.exports = { getAuthedUser, role, isApproved, clerk };
