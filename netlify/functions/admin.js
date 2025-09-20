// netlify/functions/admin.js
const { getStore } = require('@netlify/blobs');
const { DateTime } = require('luxon');

function isAdmin(user){
  if(!user) return false;
  const email = user.email || '';
  const allowEnv = (process.env.ADMIN_EMAILS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  if (allowEnv.includes(email.toLowerCase())) return true;
  const hard = []; // ex.: ['admin@seusite.com']
  return hard.includes(email.toLowerCase());
}

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if(!isAdmin(user)) return { statusCode: 403, body: 'forbidden' };

  const store = getStore('uso-diario');
  const tz = 'America/Sao_Paulo';
  const now = DateTime.now().setZone(tz);

  const url0 = new URL(event.rawUrl || ('https://x'+event.path+(event.rawQuery?'?'+event.rawQuery:'')));
  const monthParam = url0.searchParams.get('month');
  const monthKey = monthParam && /^[0-9]{6}$/.test(monthParam) ? monthParam : now.toFormat('yyyyLL');
  const url = url0;
  const fn = url.searchParams.get('fn') || 'users';

  if (event.httpMethod === 'GET' && fn === 'search_notes'){
    const tag = (url.searchParams.get('tag')||'').toLowerCase().trim();
    const result = [];
    let users = await store.get('admin:index', { type:'json' });
    if(!Array.isArray(users)) users = [];
    for (const email of users){
      const idxKey = `notes:index:${email}:${monthKey}`;
      let arr = await store.get(idxKey, { type:'json' });
      if(!Array.isArray(arr)) arr = [];
      const hits = !tag ? arr : arr.filter(n => (n.tags||[]).some(t => (t||'').toLowerCase()===tag));
      if(hits.length) result.push({ email, notes: hits });
    }
    return { statusCode: 200, headers:{'content-type':'application/json'}, body: JSON.stringify({ monthKey, tag, result }) };
  }

  if (event.httpMethod === 'GET' && fn === 'users'){
    let arr = await store.get('admin:index', { type:'json' });
    if(!Array.isArray(arr)) arr = [];
    return { statusCode: 200, headers:{'content-type':'application/json'}, body: JSON.stringify({ users: arr }) };
  }

  if (event.httpMethod === 'GET' && fn === 'usage'){
    const email = url.searchParams.get('email') || '';
    const kMonth = `uso_mensal:${email}:${monthKey}`;
    const kDayPrefix = `uso:${email}:`;
    const dayKey = now.toFormat('yyyyLLdd');
    const dayRaw = (await store.get(kDayPrefix+dayKey, { type:'text' })) || '0';
    const monthRaw = (await store.get(kMonth, { type:'text' })) || '0';
    return { statusCode: 200, headers:{'content-type':'application/json'}, body: JSON.stringify({ email, day: Number(dayRaw)||0, month: Number(monthRaw)||0, monthKey }) };
  }

  if (event.httpMethod === 'GET' && fn === 'csv'){
    const email = url.searchParams.get('email') || '';
    const kLog = `log:${email}:${monthKey}`;
    let log = await store.get(kLog, { type: 'json' });
    if (!Array.isArray(log)) log = [];
    let csv = 'data_hora,acao,dia\n';
    for (const item of log){
      const ts = DateTime.fromISO(item.ts || now.toISO(), { zone: tz }).toFormat("yyyy-LL-dd HH:mm:ss");
      const action = (item.action || 'generate').replace(/[,;\n]/g, ' ');
      const day = (item.day || '').toString();
      csv += `${ts},${action},${day}\n`;
    }
    return { statusCode: 200, headers: {'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="uso_${email}_${monthKey}.csv"`}, body: csv };
  }

  if (event.httpMethod === 'POST' && fn === 'plan'){
    try{
      const body = JSON.parse(event.body||'{}');
      const email = (body.email||'').trim();
      const plan = (body.plan==='pro'?'pro':'basic');
      if(!email) return { statusCode: 400, body: 'email required' };
      await store.set(`plan:${email}`, plan);
      try{
        let arr = await store.get('admin:index', { type:'json' });
        if(!Array.isArray(arr)) arr = [];
        if(!arr.includes(email)) arr.push(email);
        await store.set('admin:index', JSON.stringify(arr));
      }catch(e){};
      return { statusCode: 200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true, email, plan }) };
    }catch(e){
      return { statusCode: 400, body: 'bad request' };
    }
  }

  return { statusCode: 405, body: 'method not allowed' };
};
