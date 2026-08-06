const { getStore } = require('@netlify/blobs');

// Netlify's automatic Blobs context injection (NETLIFY_BLOBS_CONTEXT) has been
// unreliable — failing with MissingBlobsEnvironmentError even on Git-linked
// deploys. This helper works around it by passing siteID + token explicitly
// whenever they're available, and only falls back to auto-injection if they're not.
//
// Requires these two environment variables to be set in
// Netlify → Site settings → Environment variables:
//   BLOBS_SITE_ID  — your Project ID (Project configuration → General → Project information)
//   BLOBS_TOKEN    — a Personal Access Token (User settings → Applications → New access token)
function woodoraStore() {
  const siteID = process.env.BLOBS_SITE_ID;
  const token = process.env.BLOBS_TOKEN;

  if (siteID && token) {
    return getStore({ name: 'woodora', siteID, token });
  }

  // Fallback: relies on Netlify's auto-injection, which is what was failing.
  return getStore('woodora');
}

module.exports = { woodoraStore };
