// netlify/functions/limite.js
const { getStore } = require('@netlify/blobs');
const { DateTime } = require('luxon');

const DAILY_LIMITS = { basic: 3, pro: 20 };
const MONTHLY_LIMITS = { basic: 60, pro: 400 };

async function addToIndex(store, email){
  try{
    const key = 'admin:index';
    let arr = await store.get(key, { type:'json' });
    if(!Array.isArray(arr)) arr = [];
    if(email && !arr.includes(email)) arr.push(email);
    await store.set(key, JSON.stringify(arr));
  }catch(e){ /* noop */ }
}

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: 'Não autenticado' };

  const userId = user.email || user.sub || 'anon';
  const tz = 'America/Sao_Paulo';
  const now = DateTime.now().setZone(tz);
  const dayKey = now.toFormat('yyyyLLdd');
  const monthKey = now.toFormat('yyyyLL');
  const store = getStore('uso-diario');

  await addToIndex(store, userId);

  const planRaw = await store.get(`plan:${userId}`, { type:'text' }) || 'basic';
  const plan = (planRaw === 'pro' || planRaw === 'basic') ? planRaw : 'basic';
  const dailyLimit = DAILY_LIMITS[plan] ?? DAILY_LIMITS.basic;
  const monthlyLimit = MONTHLY_LIMITS[plan] ?? MONTHLY_LIMITS.basic;

  const kDay = `uso:${userId}:${dayKey}`;
  const kMonth = `uso_mensal:${userId}:${monthKey}`;
  const kLog = `log:${userId}:${monthKey}`;

  if (event.httpMethod === 'GET'){
    const dayRaw = (await store.get(kDay, { type:'text' })) || '0';
    const monthRaw = (await store.get(kMonth, { type:'text' })) || '0';
    return {
      statusCode: 200,
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({
        allowed: Number(dayRaw) < dailyLimit && Number(monthRaw) < monthlyLimit,
        count: Number(dayRaw) || 0,
        month_count: Number(monthRaw) || 0,
        plan,
        daily_limit: dailyLimit,
        monthly_limit: monthlyLimit
      })
    };
  }

  if (event.httpMethod === 'POST'){
    const dayRaw = (await store.get(kDay, { type:'text' })) || '0';
    const monthRaw = (await store.get(kMonth, { type:'text' })) || '0';
    let count = Number(dayRaw) || 0;
    let mcount = Number(monthRaw) || 0;

    if (count >= dailyLimit){
      return { statusCode: 429, headers:{'content-type':'application/json'}, body: JSON.stringify({ allowed:false, reason:'daily', count, month_count:mcount, plan, daily_limit: dailyLimit, monthly_limit: monthlyLimit }) };
    }
    if (mcount >= monthlyLimit){
      return { statusCode: 429, headers:{'content-type':'application/json'}, body: JSON.stringify({ allowed:false, reason:'monthly', count, month_count:mcount, plan, daily_limit: dailyLimit, monthly_limit: monthlyLimit }) };
    }

    count += 1; mcount += 1;
    await store.set(kDay, String(count));
    await store.set(kMonth, String(mcount));

    const ts = now.toISO();
    let log = await store.get(kLog, { type: 'json' });
    if (!Array.isArray(log)) log = [];
    log.push({ ts, action: 'generate', day: dayKey });
    await store.set(kLog, JSON.stringify(log));

    return {
      statusCode: 200,
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({ allowed:true, count, month_count:mcount, plan, daily_limit: dailyLimit, monthly_limit: monthlyLimit })
    };
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
