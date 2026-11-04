import process from 'node:process';
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const STATE_KEY = 'rojas-state';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return res.status(500).json({ error: 'admin_password_not_configured' });
  if (req.headers['x-admin-key'] !== adminPassword) return res.status(401).json({ error: 'unauthorized' });
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: 'db_not_configured' });

  const headers = { Authorization: `Bearer ${REDIS_TOKEN}` };

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${REDIS_URL}/get/${STATE_KEY}`, { headers });
      const json = await response.json();
      const data = json.result ? JSON.parse(json.result) : null;
      return res.status(200).json({ data });
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.stores) || typeof body.schedule !== 'object') {
        return res.status(400).json({ error: 'invalid_body' });
      }
      const response = await fetch(REDIS_URL, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', STATE_KEY, JSON.stringify(body)])
      });
      if (!response.ok) return res.status(502).json({ error: 'db_write_failed' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
}