// netlify/functions/auth_oauth_start.js
exports.handler = async (event)=>{
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const redirect = (process.env.BASE_URL || 'http://localhost:8888') + '/.netlify/functions/auth_oauth_callback';
  const state = Math.random().toString(36).slice(2);
  const scope = encodeURIComponent('openid email profile');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirect)}&scope=${scope}&state=${state}&access_type=online&prompt=select_account`;
  return { statusCode:302, headers:{ Location: url } };
};
