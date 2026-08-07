// Shared activity-log helper. Appends human-readable entries to a capped
// list in Blobs so a senior admin can see who changed what and when.
// Logging failures never block the actual save that triggered them.

const MAX_ENTRIES = 300;

async function logActivities(store, user, actions) {
  if (!actions || !actions.length) return;
  try {
    const log = (await store.get('activity_log', { type: 'json' })) || [];
    const now = new Date().toISOString();
    const entries = actions.map((action, i) => ({
      id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + i,
      at: now,
      actorEmail: user?.email || 'unknown',
      actorRole: user?.role || 'unknown',
      action
    }));
    const updated = [...entries.reverse(), ...log].slice(0, MAX_ENTRIES);
    await store.setJSON('activity_log', updated);
  } catch (e) {
    console.error('activity log write failed', e);
  }
}

async function logActivity(store, user, action) {
  return logActivities(store, user, [action]);
}

module.exports = { logActivity, logActivities };
