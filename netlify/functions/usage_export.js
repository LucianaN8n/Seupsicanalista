// netlify/functions/usage_export.js
const { getStore } = require('@netlify/blobs');
const { DateTime } = require('luxon');

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: 'Não autenticado' };
  const email = user.email || user.sub || 'anon';
  const tz = 'America/Sao_Paulo';
  const now = DateTime.now().setZone(tz);
  const url = new URL(event.rawUrl || ('https://x'+event.path+(event.rawQuery?'?'+event.rawQuery:'')));
  const monthParam = url.searchParams.get('month');
  const monthKey = monthParam && /^[0-9]{6}$/.test(monthParam) ? monthParam : now.toFormat('yyyyLL');
  const store = getStore('uso-diario');
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

  return {
    statusCode: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="uso_${monthKey}.csv"`
    },
    body: csv
  };
};
