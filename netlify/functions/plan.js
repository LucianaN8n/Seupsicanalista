// netlify/functions/plan.js
const { getStore } = require('@netlify/blobs');

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
  const store = getStore('uso-diario');

  if (event.httpMethod === 'GET'){
    const plan = (await store.get(`plan:${userId}`, { type:'text' })) || 'basic';
    return { statusCode: 200, headers:{'content-type':'application/json'}, body: JSON.stringify({ plan }) };
  }

  if (event.httpMethod === 'POST'){
    try{
      const body = JSON.parse(event.body||'{}');
      const plan = body.plan === 'pro' ? 'pro' : 'basic';
      await store.set(`plan:${userId}`, plan);
      await addToIndex(store, userId);
      return { statusCode: 200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true, plan }) };
    }catch(e){
      return { statusCode: 400, body: 'bad request' };
    }
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
