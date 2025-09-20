// netlify/functions/notes.js
const { getStore } = require('@netlify/blobs');
const { DateTime } = require('luxon');

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: 'Não autenticado' };
  const email = user.email || user.sub || 'anon';
  const store = getStore('uso-diario');
  const tz = 'America/Sao_Paulo';
  const now = DateTime.now().setZone(tz);
  const url = new URL(event.rawUrl || ('https://x'+event.path+(event.rawQuery?'?'+event.rawQuery:'')));
  const monthKey = url.searchParams.get('month') || now.toFormat('yyyyLL');
  const idParam = url.searchParams.get('id');

  if (event.httpMethod === 'GET'){
    if (idParam){
      const key = `notes:${email}:${monthKey}:${idParam}`;
      const obj = await store.get(key, { type:'json' });
      if(!obj) return { statusCode: 404, body: 'not found' };
      return { statusCode: 200, headers:{'content-type':'application/json'}, body: JSON.stringify(obj) };
    }
    const idxKey = `notes:index:${email}:${monthKey}`;
    let arr = await store.get(idxKey, { type:'json' });
    if(!Array.isArray(arr)) arr = [];
    return { statusCode: 200, headers:{'content-type':'application/json'}, body: JSON.stringify({ notes: arr }) };
  }

  if (event.httpMethod === 'POST'){
    try{
      const body = JSON.parse(event.body||'{}');
      const { ciphertext, iv, salt, tags } = body;
      if(!ciphertext || !iv || !salt) return { statusCode: 400, body: 'invalid payload' };
      const stamp = now.toISO();
      const noteId = `${stamp}`;
      const key = `notes:${email}:${monthKey}:${noteId}`;
      await store.set(key, JSON.stringify({ ciphertext, iv, salt, tags: Array.isArray(tags)? tags : [], ts: stamp }));

      const idxKey = `notes:index:${email}:${monthKey}`;
      let arr = await store.get(idxKey, { type:'json' });
      if(!Array.isArray(arr)) arr = [];
      arr.push({ id: noteId, tags: Array.isArray(tags)? tags : [], ts: stamp });
      await store.set(idxKey, JSON.stringify(arr));

      return { statusCode: 200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true, id: noteId }) };
    }catch(e){
      return { statusCode: 400, body: 'bad request' };
    }
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
