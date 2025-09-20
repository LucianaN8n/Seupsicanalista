// netlify/functions/auth_request_reset.js
const { getStore } = require('@netlify/blobs');
const { randomId } = require('./_lib/token');
async function sendEmailResend(to, subject, html){
  const key = process.env.RESEND_API_KEY || '';
  const from = process.env.FROM_EMAIL || 'no-reply@example.com';
  if(!key) throw new Error('RESEND_API_KEY missing');
  const r = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{ 'Authorization': `Bearer ${key}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ from, to, subject, html })
  });
  if(!r.ok){
    const t = await r.text();
    throw new Error('Resend error: '+t);
  }
}

exports.handler = async (event)=>{
  if(event.httpMethod!=='POST') return { statusCode:405, body:'method not allowed' };
  try{
    const { email } = JSON.parse(event.body||'{}');
    if(!email) return { statusCode:400, body:'email required' };
    const mail = String(email).trim().toLowerCase();
    const store = getStore('uso-diario');
    const user = await store.get(`user:${mail}`, { type:'json' });
    // Não revele se o usuário existe ou não (segurança)
    const id = randomId(16); const token = randomId(24);
    const exp = Date.now() + 1000*60*30; // 30 min
    await store.set(`reset:${mail}:${id}`, JSON.stringify({ token, exp }));
    const base = process.env.BASE_URL || 'http://localhost:8888';
    const link = `${base}/reset.html?email=${encodeURIComponent(mail)}&id=${id}&token=${token}`;
    const html = `<p>Olá! Para redefinir sua senha, clique no link abaixo (válido por 30 minutos):</p>
                  <p><a href="${link}">${link}</a></p>
                  <p>Se não foi você, ignore este e-mail.</p>`;
    if (process.env.RESEND_API_KEY){
      await sendEmailResend(mail, 'Redefinir sua senha', html);
    }
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true }) };
  }catch(e){
    // Não revelar detalhes
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true }) };
  }
};
