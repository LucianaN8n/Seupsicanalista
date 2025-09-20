// netlify/functions/env_check.js
const { verify } = require('./_lib/token');

function isAdmin(email) {
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes((email || '').toLowerCase());
}

exports.handler = async (event) => {
  const auth = event.headers.authorization || '';
  const tok = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!tok) return { statusCode: 401, body: 'no token' };

  let payload;
  try {
    payload = verify(tok);
  } catch (e) {
    return { statusCode: 401, body: 'invalid token' };
  }

  if (!isAdmin(payload.email)) {
    return { statusCode: 403, body: 'forbidden' };
  }

  const vars = [
    'APP_SECRET',
    'ADMIN_EMAILS',
    'BASE_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'RESEND_API_KEY',
    'FROM_EMAIL',
    'HOTMART_HOTTOK'
  ];

  const result = {};
  for (const v of vars) {
    result[v] = process.env[v] ? '✅ set' : '❌ missing';
  }

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(result, null, 2)
  };
};
