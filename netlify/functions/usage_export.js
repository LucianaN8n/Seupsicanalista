// netlify/functions/usage_export.js
const { getStore } = require('@netlify/blobs');
const { DateTime } = require('luxon');
const { verify } = require('./_lib/token');
exports.handler = async (event)=>{
  const auth=event.headers.authorization||''; const tok=auth.startsWith('Bearer ')? auth.slice(7): null; if(!tok) return { statusCode:401, body:'no token' };
  let email; try{ email = verify(tok).email; }catch(e){ return { statusCode:401, body:'invalid token' }; }
  const store = getStore('uso-diario'); const tz='America/Sao_Paulo'; const now=DateTime.now().setZone(tz);
  const url=new URL(event.rawUrl||('https://x'+event.path+(event.rawQuery?'?'+event.rawQuery:''))); const monthKey=(url.searchParams.get('month')||now.toFormat('yyyyLL')).replace(/[^0-9]/g,'');
  let log = await store.get(`log:${email}:${monthKey}`, { type:'json' }); if(!Array.isArray(log)) log=[];
  let csv='data_hora,acao,dia\n'; for(const it of log){ csv+=`${it.ts||''},${(it.action||'').replace(/[,;\n]/g,' ')},${it.day||''}\n`; }
  return { statusCode:200, headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="uso_${monthKey}.csv"`}, body: csv };
};
