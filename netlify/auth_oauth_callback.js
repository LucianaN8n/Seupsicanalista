// netlify/functions/auth_oauth_callback.js
const fetch = require('node-fetch');
const { getStore } = require('@netlify/blobs');
const { sign } = require('./_lib/token');

exports.handler = async (event)=>{
  try{
    const url = new URL(event.rawUrl || ('https://x'+event.path+(event.rawQuery?'?'+event.rawQuery:'')));
    const code = url.searchParams.get('code');
    if(!code) return { statusCode:400, body:'no code' };
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri = (process.env.BASE_URL || 'http://localhost:8888') + '/.netlify/functions/auth_oauth_callback';

    // troca código por token
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method:'POST',
      headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: 'authorization_code'
      })
    });
    if(!r.ok){ const t = await r.text(); return { statusCode:400, body: 'token error: '+t }; }
    const tk = await r.json();
    // userinfo
    const u = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tk.access_token}`}});
    if(!u.ok){ const t = await u.text(); return { statusCode:400, body: 'userinfo error: '+t }; }
    const info = await u.json();
    const email = String(info.email||'').toLowerCase();
    if(!email) return { statusCode:400, body:'no email' };

    const store = getStore('uso-diario');
    const key = `user:${email}`;
    let user = await store.get(key, { type:'json' });
    if(!user){
      user = { email, plan:'basic', createdAt: Date.now(), oauth:'google' };
      await store.set(key, JSON.stringify(user));
      try{ let arr=await store.get('admin:index',{type:'json'}); if(!Array.isArray(arr)) arr=[]; if(!arr.includes(email)) arr.push(email); await store.set('admin:index', JSON.stringify(arr)); }catch(e){}
    }
    const token = sign({ email, plan: user.plan });
    const base = process.env.BASE_URL || '/';
    const done = `${base}/oauth-done.html#token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    return { statusCode:302, headers:{ Location: done } };
  }catch(e){
    return { statusCode:400, body:'oauth error' };
  }
};
