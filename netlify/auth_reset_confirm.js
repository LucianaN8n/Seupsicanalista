// netlify/functions/auth_reset_confirm.js
const { getStore } = require('@netlify/blobs');
const { hashPassword } = require('./_lib/token');
exports.handler = async (event)=>{
  if(event.httpMethod!=='POST') return { statusCode:405, body:'method not allowed' };
  try{
    const { email, id, token, new_password } = JSON.parse(event.body||'{}');
    if(!email || !id || !token || !new_password) return { statusCode:400, body:'missing fields' };
    const mail = String(email).trim().toLowerCase();
    const store = getStore('uso-diario');
    const rec = await store.get(`reset:${mail}:${id}`, { type:'json' });
    if(!rec || rec.token !== token || rec.exp < Date.now()) return { statusCode:400, body:'invalid or expired' };
    const key = `user:${mail}`; let user = await store.get(key, { type:'json' }); if(!user) return { statusCode:404, body:'user not found' };
    user.pass = hashPassword(new_password);
    await store.set(key, JSON.stringify(user));
    await store.delete(`reset:${mail}:${id}`);
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true }) };
  }catch(e){ return { statusCode:400, body:'bad request' }; }
};
