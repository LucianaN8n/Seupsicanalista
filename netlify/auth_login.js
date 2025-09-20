// netlify/functions/auth_login.js
const { getStore } = require('@netlify/blobs');
const { verifyPassword, sign } = require('./_lib/token');
exports.handler = async (event)=>{
  if(event.httpMethod!=='POST') return { statusCode:405, body:'method not allowed' };
  try{
    const { email, password } = JSON.parse(event.body||'{}');
    if(!email || !password) return { statusCode:400, body:'email/password required' };
    const mail = String(email).trim().toLowerCase();
    const store = getStore('uso-diario');
    const user = await store.get(`user:${mail}`, { type:'json' });
    if(!user || !verifyPassword(password, user.pass||'')) return { statusCode:401, body:'invalid credentials' };
    const token = sign({ email: user.email, plan: user.plan });
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ token, email:user.email, plan:user.plan }) };
  }catch(e){ return { statusCode:400, body:'bad request' }; }
};
