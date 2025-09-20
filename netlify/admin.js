// netlify/functions/admin.js
const { getStore } = require('@netlify/blobs');
const { DateTime } = require('luxon');
const { verify } = require('./_lib/token');
function isAdmin(email){ const allow=(process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean); return allow.includes((email||'').toLowerCase()); }
exports.handler = async (event)=>{
  const auth = event.headers.authorization||''; const tok = auth.startsWith('Bearer ')? auth.slice(7): null;
  if(!tok) return { statusCode:401, body:'no token' };
  let payload; try{ payload = verify(tok); }catch(e){ return { statusCode:401, body:'invalid token' }; }
  if(!isAdmin(payload.email)) return { statusCode:403, body:'forbidden' };
  const store = getStore('uso-diario'); const tz='America/Sao_Paulo'; const now=DateTime.now().setZone(tz);
  const url = new URL(event.rawUrl || ('https://x'+event.path+(event.rawQuery?'?'+event.rawQuery:''))); const monthKey=(url.searchParams.get('month')||now.toFormat('yyyyLL')).replace(/[^0-9]/g,'');
  const fn = url.searchParams.get('fn') || 'users';
  if(event.httpMethod==='GET' && fn==='users'){ let arr=await store.get('admin:index',{type:'json'}); if(!Array.isArray(arr)) arr=[]; return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ users: arr }) }; }
  if(event.httpMethod==='GET' && fn==='usage'){ const email=url.searchParams.get('email')||''; const dayKey=now.toFormat('yyyyLLdd'); const d=Number((await store.get(`uso:${email}:${dayKey}`,{type:'text'}))||'0'); const m=Number((await store.get(`uso_mensal:${email}:${monthKey}`,{type:'text'}))||'0'); return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ email, day:d, month:m, monthKey }) }; }
  if(event.httpMethod==='GET' && fn==='csv'){ const email=url.searchParams.get('email')||''; let log=await store.get(`log:${email}:${monthKey}`,{type:'json'}); if(!Array.isArray(log)) log=[]; let csv='data_hora,acao,dia\n'; for(const it of log){ csv+=`${it.ts||''},${(it.action||'').replace(/[,;\n]/g,' ')},${it.day||''}\n`; } return { statusCode:200, headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="uso_${email}_${monthKey}.csv"`}, body: csv }; }
  if(event.httpMethod==='POST' && fn==='plan'){ try{ const { email, plan } = JSON.parse(event.body||'{}'); if(!email) return { statusCode:400, body:'email required' }; const key=`user:${email}`; let user=await store.get(key,{type:'json'})||{email}; user.plan=(plan==='pro'?'pro':'basic'); await store.set(key, JSON.stringify(user)); let arr=await store.get('admin:index',{type:'json'}); if(!Array.isArray(arr)) arr=[]; if(!arr.includes(email)) arr.push(email); await store.set('admin:index', JSON.stringify(arr)); return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true }) }; }catch(e){ return { statusCode:400, body:'bad request' }; }
  }
  return { statusCode:405, body:'method not allowed' };
};
