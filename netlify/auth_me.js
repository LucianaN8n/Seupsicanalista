// netlify/functions/auth_me.js
const { getStore } = require('@netlify/blobs');
const { verify } = require('./_lib/token');
exports.handler = async (event)=>{
  const auth = event.headers.authorization||''; const tok = auth.startsWith('Bearer ')? auth.slice(7): null;
  if(!tok) return { statusCode:401, body:'no token' };
  try{
    const payload = verify(tok);
    const store = getStore('uso-diario');
    const user = await store.get(`user:${payload.email}`, { type:'json' });
    if(!user) return { statusCode:401, body:'invalid user' };
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ email:user.email, plan:user.plan }) };
  }catch(e){ return { statusCode:401, body:'invalid token' }; }
};
