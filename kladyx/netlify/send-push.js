// netlify/functions/send-push.js
// Odesílá Web Push notifikaci všem uloženým subscriptions
const webpush = require('web-push');
const https = require('https');

// VAPID konfigurace
webpush.setVapidDetails(
  'mailto:kladyx@kladyxland.netlify.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async (event) => {
  // Ochrana – pouze POST s tajným tokenem
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authHeader = event.headers['x-push-secret'];
  if (authHeader !== process.env.PUSH_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const isLive = body.live === true;

    const payload = JSON.stringify({
      title: isLive ? '🎧 KLADYXLAND – LIVE!' : '📴 KLADYXLAND',
      body: isLive
        ? 'Míša právě spustil živé vysílání! Připoj se!'
        : 'Vysílání skončilo. Brzy zase!',
      url: 'https://kladyxland.netlify.app'
    });

    // Načti všechny subscriptions z Firebase
    const FIREBASE_URL = process.env.FIREBASE_DB_URL;
    const FIREBASE_SECRET = process.env.FIREBASE_SECRET;

    const subsData = await new Promise((resolve, reject) => {
      const url = new URL(FIREBASE_URL + `/push_subscriptions.json?auth=${FIREBASE_SECRET}`);
      https.get({ hostname: url.hostname, path: url.pathname + url.search }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { resolve(null); }
        });
      }).on('error', reject);
    });

    if (!subsData) {
      return { statusCode: 200, body: JSON.stringify({ sent: 0, msg: 'No subscriptions' }) };
    }

    const subs = Object.values(subsData);
    let sent = 0, failed = 0;

    await Promise.allSettled(
      subs.map(async sub => {
        try {
          await webpush.sendNotification(sub, payload);
          sent++;
        } catch (err) {
          console.warn('Push failed for sub:', err.statusCode, err.message);
          failed++;
        }
      })
    );

    console.log(`Push odeslán: ${sent} OK, ${failed} failed`);
    return { statusCode: 200, body: JSON.stringify({ sent, failed }) };
  } catch (err) {
    console.error('send-push error:', err);
    return { statusCode: 500, body: err.message };
  }
};
