// netlify/functions/auth_register.js
const { getStore } = require('@netlify/blobs');
const { hashPassword } = require('./_lib/token');
exports.handler = async (event)=>{
  if(event.httpMethod!=='POST') return { statusCode:405, body:'method not allowed' };
  try{
    const { email, password } = JSON.parse(event.body||'{}');
    if(!email || !password) return { statusCode:400, body:'email/password required' };
    const mail = String(email).trim().toLowerCase();
    const store = getStore('uso-diario');
    const key = `user:${mail}`;
    const exists = await store.get(key,{type:'json'});
    if(exists) return { statusCode:409, body:'user exists' };
    const user = { email: mail, pass: hashPassword(password), plan:'basic', createdAt: Date.now() };
    await store.set(key, JSON.stringify(user));
    try{ let arr=await store.get('admin:index',{type:'json'}); if(!Array.isArray(arr)) arr=[]; if(!arr.includes(mail)) arr.push(mail); await store.set('admin:index', JSON.stringify(arr)); }catch(e){}
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true }) };
  }catch(e){ return { statusCode:400, body:'bad request' }; }
};
