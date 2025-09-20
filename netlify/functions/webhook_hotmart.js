// netlify/functions/webhook_hotmart.js
// Webhook Hotmart com whitelist de produto/oferta.
// Valida X-HOTMART-HOTTOK via env HOTMART_HOTTOK.
// Ativa PRO quando aprovado/ativo; volta para BASIC quando cancelado/refundado/overdue.

const { getStore } = require('@netlify/blobs');
const querystring = require('querystring');

const PRO_MAP_PURCHASE = ['APPROVED', 'COMPLETE', 'COMPLETED'];
const BASIC_MAP_PURCHASE = ['CANCELLED', 'CANCELED', 'CHARGEBACK', 'REFUNDED', 'EXPIRED', 'BLOCKED', 'DELAYED'];
const PRO_SUBSCRIPTION = ['ACTIVE', 'STARTED'];
const BASIC_SUBSCRIPTION = ['CANCELED_BY_CUSTOMER','CANCELED_BY_VENDOR','CANCELED_BY_ADMIN','INACTIVE','EXPIRED','OVERDUE','CANCELLED'];

function parseCommaEnv(name){ return (process.env[name]||'').split(',').map(s=>s.trim()).filter(Boolean); }
function readHottok(event){ return (event.headers['x-hotmart-hottok'] || event.headers['X-HOTMART-HOTTOK'] || '').trim(); }
function ok(body){ return { statusCode: 200, body: body || 'ok' }; }
function bad(msg){ return { statusCode: 400, body: msg || 'bad request' }; }
function forbidden(){ return { statusCode: 403, body: 'forbidden' }; }
function toUpper(x){ return (x||'').toString().trim().toUpperCase(); }

function parseBody(event){
  const ctype = (event.headers['content-type']||'').toLowerCase();
  if (ctype.includes('application/json')){ try{ return JSON.parse(event.body||'{}'); }catch(e){ return {}; } }
  if (ctype.includes('application/x-www-form-urlencoded')){ try{ return querystring.parse(event.body||''); }catch(e){ return {}; } }
  try{ return JSON.parse(event.body||'{}'); }catch(e){}
  try{ return querystring.parse(event.body||''); }catch(e){}
  return {};
}

async function setPlan(email, plan){
  const store = getStore('uso-diario');
  await store.set(`plan:${email}`, plan);
  try{
    const key = 'admin:index';
    let arr = await store.get(key, { type:'json' });
    if(!Array.isArray(arr)) arr = [];
    if(email && !arr.includes(email)) arr.push(email);
    await store.set(key, JSON.stringify(arr));
  }catch(e){}
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return bad('use POST');
  const incoming = readHottok(event);
  const expected = (process.env.HOTMART_HOTTOK || '').trim();
  if (!expected) return bad('HOTMART_HOTTOK não definido');
  if (incoming !== expected) return forbidden();

  const url = new URL(event.rawUrl || ('https://x'+event.path+(event.rawQuery?'?'+event.rawQuery:'')));
  const data = parseBody(event);

  const productId = (data.product_id || (data.data && data.data.product && (data.data.product.id || data.data.product.product_id)) || data.prod || '').toString();
  const offerId = (data.offer_id || (data.data && (data.data.offer || data.data.offer_id)) || data.off || '').toString();
  const allowProd = parseCommaEnv('HOTMART_ALLOWED_PRODUCTS');
  const allowOffers = parseCommaEnv('HOTMART_ALLOWED_OFFERS');
  if (allowProd.length && productId && !allowProd.includes(productId)) return ok('ignored: product mismatch');
  if (allowOffers.length && offerId && !allowOffers.includes(offerId)) return ok('ignored: offer mismatch');

  const email = (data.email || (data.buyer && data.buyer.email) || (data.data && data.data.buyer && data.data.buyer.email) || '').toString().trim().toLowerCase();
  const purchaseStatus = toUpper(data.status || (data.data && data.data.status));
  const subscriptionStatus = toUpper(data.subscription_status || (data.data && data.data.subscription_status));
  const eventType = toUpper(data.event || data.type || '');

  if(!email) return ok('no-email');

  let target = null;
  if (purchaseStatus){
    if (PRO_MAP_PURCHASE.includes(purchaseStatus)) target = 'pro';
    if (BASIC_MAP_PURCHASE.includes(purchaseStatus)) target = 'basic';
  }
  if (subscriptionStatus){
    if (PRO_SUBSCRIPTION.includes(subscriptionStatus)) target = 'pro';
    if (BASIC_SUBSCRIPTION.includes(subscriptionStatus)) target = 'basic';
  }
  if(!target && eventType){
    if (['PURCHASE_APPROVED','PURCHASE_COMPLETE','PURCHASE_COMPLETED'].includes(eventType)) target = 'pro';
    if (['PURCHASE_CANCELED','PURCHASE_CANCELLED','PURCHASE_REFUNDED','PURCHASE_EXPIRED','PURCHASE_DELAYED'].includes(eventType)) target = 'basic';
    if (['SUBSCRIPTION_ACTIVE','SUBSCRIPTION_STARTED','SWITCH_PLAN'].includes(eventType)) target = 'pro';
    if (['SUBSCRIPTION_CANCELED','SUBSCRIPTION_CANCELLED','SUBSCRIPTION_INACTIVE','SUBSCRIPTION_OVERDUE','SUBSCRIPTION_EXPIRED'].includes(eventType)) target = 'basic';
  }

  if (!target) return ok('ignored');

  await setPlan(email, target);
  return ok(`set ${email} -> ${target}`);
};
