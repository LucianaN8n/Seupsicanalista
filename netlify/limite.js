// netlify/functions/limite.js
const { getStore } = require('@netlify/blobs');
const { DateTime } = require('luxon');
const { verify } = require('./_lib/token');
const DAILY = { basic:3, pro:20 }; const MONTHLY = { basic:60, pro:400 };
exports.handler = async (event)=>{
  const auth = event.headers.authorization||''; const tok = auth.startsWith('Bearer ')? auth.slice(7): null;
  if(!tok) return { statusCode:401, body:'no token' };
  let email, plan; try{ const p=verify(tok); email=p.email; plan=p.plan||'basic'; }catch(e){ return { statusCode:401, body:'invalid token' }; }
  const store = getStore('uso-diario'); const tz='America/Sao_Paulo'; const now = DateTime.now().setZone(tz);
  const dayKey = now.toFormat('yyyyLLdd'); const monthKey = now.toFormat('yyyyLL');
  const user = await store.get(`user:${email}`, { type:'json' }); plan = (user&&user.plan)||plan||'basic';
  const dlim = DAILY[plan]??DAILY.basic; const mlim = MONTHLY[plan]??MONTHLY.basic;
  const kDay=`uso:${email}:${dayKey}`, kMonth=`uso_mensal:${email}:${monthKey}`, kLog=`log:${email}:${monthKey}`;
  if(event.httpMethod==='GET'){
    const c = Number((await store.get(kDay,{type:'text'}))||'0'); const m = Number((await store.get(kMonth,{type:'text'}))||'0');
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ allowed: c<dlim && m<mlim, count:c, month_count:m, plan, daily_limit:dlim, monthly_limit:mlim }) };
  }
  if(event.httpMethod==='POST'){
    let c=Number((await store.get(kDay,{type:'text'}))||'0'), m=Number((await store.get(kMonth,{type:'text'}))||'0');
    if(c>=dlim) return { statusCode:429, headers:{'content-type':'application/json'}, body: JSON.stringify({ allowed:false, reason:'daily', count:c, month_count:m, plan, daily_limit:dlim, monthly_limit:mlim }) };
    if(m>=mlim) return { statusCode:429, headers:{'content-type':'application/json'}, body: JSON.stringify({ allowed:false, reason:'monthly', count:c, month_count:m, plan, daily_limit:dlim, monthly_limit:mlim }) };
    c+=1; m+=1; await store.set(kDay,String(c)); await store.set(kMonth,String(m));
    let log = await store.get(kLog,{type:'json'}); if(!Array.isArray(log)) log=[]; log.push({ ts: now.toISO(), action:'generate', day: dayKey }); await store.set(kLog, JSON.stringify(log));
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ allowed:true, count:c, month_count:m, plan, daily_limit:dlim, monthly_limit:mlim }) };
  }
  return { statusCode:405, body:'method not allowed' };
};
