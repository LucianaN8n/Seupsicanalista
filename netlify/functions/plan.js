// netlify/functions/plan.js
const { getStore } = require('@netlify/blobs');
const { verify } = require('./_lib/token');
exports.handler = async (event)=>{
  const auth = event.headers.authorization||''; const tok = auth.startsWith('Bearer ')? auth.slice(7): null;
  if(!tok) return { statusCode:401, body:'no token' };
  let email; try{ email = verify(tok).email; }catch(e){ return { statusCode:401, body:'invalid token' }; }
  const store = getStore('uso-diario');
  if(event.httpMethod==='GET'){
    const user = await store.get(`user:${email}`, { type:'json' }); return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ plan: user?.plan||'basic' }) };
  }
  if(event.httpMethod==='POST'){
    try{ const body = JSON.parse(event.body||'{}'); const plan = body.plan==='pro'?'pro':'basic'; const key=`user:${email}`; let user=await store.get(key,{type:'json'})||{email}; user.plan=plan; await store.set(key, JSON.stringify(user)); return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true, plan }) }; }catch(e){ return { statusCode:400, body:'bad request' }; }
  }
  return { statusCode:405, body:'method not allowed' };
};
