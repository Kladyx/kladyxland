// netlify/functions/save-subscription.js
// Ukládá Web Push subscription do Firebase Realtime Database
const https = require('https');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const sub = JSON.parse(event.body);
    if (!sub || !sub.endpoint) {
      return { statusCode: 400, body: 'Invalid subscription' };
    }

    // ID = hash endpointu (unikátní klíč pro Firebase)
    const id = crypto.createHash('sha256').update(sub.endpoint).digest('hex').slice(0, 20);

    const FIREBASE_URL = process.env.FIREBASE_DB_URL; // nastav v Netlify env
    const FIREBASE_SECRET = process.env.FIREBASE_SECRET; // Firebase DB secret

    const payload = JSON.stringify(sub);
    const path = `/push_subscriptions/${id}.json?auth=${FIREBASE_SECRET}`;

    await new Promise((resolve, reject) => {
      const url = new URL(FIREBASE_URL + path);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      };
      const req = https.request(options, res => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, id }) };
  } catch (err) {
    console.error('save-subscription error:', err);
    return { statusCode: 500, body: err.message };
  }
};
