// netlify/functions/webhook_hotmart.js
const { getStore } = require('@netlify/blobs');
const querystring = require('querystring');
const PRO_MAP_PURCHASE = ['APPROVED','COMPLETE','COMPLETED'];
const BASIC_MAP_PURCHASE = ['CANCELLED','CANCELED','CHARGEBACK','REFUNDED','EXPIRED','BLOCKED','DELAYED'];
const PRO_SUBSCRIPTION = ['ACTIVE','STARTED'];
const BASIC_SUBSCRIPTION = ['CANCELED_BY_CUSTOMER','CANCELED_BY_VENDOR','CANCELED_BY_ADMIN','INACTIVE','EXPIRED','OVERDUE','CANCELLED'];
function parseCommaEnv(name){ return (process.env[name]||'').split(',').map(s=>s.trim()).filter(Boolean); }
function readHottok(event){ return (event.headers['x-hotmart-hottok']||event.headers['X-HOTMART-HOTTOK']||'').trim(); }
function ok(b){ return { statusCode:200, body:b||'ok' }; } function bad(m){ return { statusCode:400, body:m||'bad request' }; } function forbidden(){ return { statusCode:403, body:'forbidden' }; }
function toUpper(x){ return (x||'').toString().trim().toUpperCase(); }
function parseBody(e){ const ct=(e.headers['content-type']||'').toLowerCase(); if(ct.includes('json')){ try{ return JSON.parse(e.body||'{}'); }catch{} } if(ct.includes('x-www-form-urlencoded')){ try{ return querystring.parse(e.body||''); }catch{} } try{ return JSON.parse(e.body||'{}'); }catch{} try{ return querystring.parse(e.body||''); }catch{} return {}; }
exports.handler = async (event)=>{
  if(event.httpMethod!=='POST') return bad('use POST');
  const incoming=readHottok(event); const expected=(process.env.HOTMART_HOTTOK||'').trim(); if(!expected) return bad('HOTMART_HOTTOK não definido'); if(incoming!==expected) return forbidden();
  const store=getStore('uso-diario'); const data=parseBody(event);
  const productId=(data.product_id||(data.data&&data.data.product&&(data.data.product.id||data.data.product.product_id))||data.prod||'').toString();
  const offerId=(data.offer_id||(data.data&&(data.data.offer||data.data.offer_id))||data.off||'').toString();
  const allowProd=parseCommaEnv('HOTMART_ALLOWED_PRODUCTS'); const allowOffers=parseCommaEnv('HOTMART_ALLOWED_OFFERS');
  if(allowProd.length && productId && !allowProd.includes(productId)) return ok('ignored: product mismatch');
  if(allowOffers.length && offerId && !allowOffers.includes(offerId)) return ok('ignored: offer mismatch');
  const email=(data.email||(data.buyer&&data.buyer.email)||(data.data&&data.data.buyer&&data.data.buyer.email)||'').toString().trim().toLowerCase();
  const purchaseStatus=toUpper(data.status||(data.data&&data.data.status)); const subscriptionStatus=toUpper(data.subscription_status||(data.data&&data.data.subscription_status)); const eventType=toUpper(data.event||data.type||'');
  if(!email) return ok('no-email');
  let target=null;
  if(purchaseStatus){ if(PRO_MAP_PURCHASE.includes(purchaseStatus)) target='pro'; if(BASIC_MAP_PURCHASE.includes(purchaseStatus)) target='basic'; }
  if(subscriptionStatus){ if(PRO_SUBSCRIPTION.includes(subscriptionStatus)) target='pro'; if(BASIC_SUBSCRIPTION.includes(subscriptionStatus)) target='basic'; }
  if(!target && eventType){ if(['PURCHASE_APPROVED','PURCHASE_COMPLETE','PURCHASE_COMPLETED'].includes(eventType)) target='pro'; if(['PURCHASE_CANCELED','PURCHASE_CANCELLED','PURCHASE_REFUNDED','PURCHASE_EXPIRED','PURCHASE_DELAYED'].includes(eventType)) target='basic'; if(['SUBSCRIPTION_ACTIVE','SUBSCRIPTION_STARTED','SWITCH_PLAN'].includes(eventType)) target='pro'; if(['SUBSCRIPTION_CANCELED','SUBSCRIPTION_CANCELLED','SUBSCRIPTION_INACTIVE','SUBSCRIPTION_OVERDUE','SUBSCRIPTION_EXPIRED'].includes(eventType)) target='basic'; }
  if(!target) return ok('ignored');
  const key=`user:${email}`; let user=await store.get(key,{type:'json'})||{email,plan:'basic',createdAt:Date.now()}; user.plan=target; await store.set(key, JSON.stringify(user));
  try{ let arr=await store.get('admin:index',{type:'json'}); if(!Array.isArray(arr)) arr=[]; if(!arr.includes(email)) arr.push(email); await store.set('admin:index', JSON.stringify(arr)); }catch(e){}
  return ok(`set ${email} -> ${target}`);
};
