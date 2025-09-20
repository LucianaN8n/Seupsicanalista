// netlify/functions/_lib/token.js
const crypto = require('crypto');
const SECRET = process.env.APP_SECRET || 'dev-secret-change-me';
function b64url(buf){ return Buffer.from(buf).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64urlJSON(obj){ return b64url(Buffer.from(JSON.stringify(obj))); }
function parseB64url(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; return Buffer.from(str,'base64'); }
function sign(payload, exp=60*60*24*7){ const h={alg:'HS256',typ:'JWT'}; const now=Math.floor(Date.now()/1000); const p={...payload,iat:now,exp:now+exp}; const data=b64urlJSON(h)+'.'+b64urlJSON(p); const sig=crypto.createHmac('sha256',SECRET).update(data).digest(); return data+'.'+b64url(sig); }
function verify(tok){ if(!tok||tok.split('.').length!==3) throw new Error('bad'); const [h,p,s]=tok.split('.'); const data=h+'.'+p; const sig=crypto.createHmac('sha256',SECRET).update(data).digest(); if(!crypto.timingSafeEqual(sig, parseB64url(s))) throw new Error('sig'); const payload=JSON.parse(parseB64url(p).toString('utf8')); const now=Math.floor(Date.now()/1000); if(payload.exp && payload.exp<now) throw new Error('exp'); return payload; }
function hashPassword(password){ const salt=crypto.randomBytes(16); const N=16384,r=8,p=1,len=64; const hash=crypto.scryptSync(password,salt,len,{N,r,p}); return `scrypt$${N}$${r}$${salt.toString('base64')}$${hash.toString('base64')}`; }
function verifyPassword(password, stored){ try{ const [algo,Ns,rs,saltB64,hashB64]=stored.split('$'); if(algo!=='scrypt') return false; const N=Number(Ns),r=Number(rs),p=1,len=64; const salt=Buffer.from(saltB64,'base64'); const expect=Buffer.from(hashB64,'base64'); const got=crypto.scryptSync(password,salt,len,{N,r,p}); return crypto.timingSafeEqual(got, expect); }catch(e){ return false; } }
function randomId(n=32){ return crypto.randomBytes(n).toString('hex'); }
module.exports = { sign, verify, hashPassword, verifyPassword, randomId };
