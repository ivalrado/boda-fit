// Manda los avisos del héroe. Las llaves y las suscripciones viven en el caché privado de Actions.
import webpush from 'web-push';
import fs from 'fs';
const DIR='.pushstate', TOPIC=process.env.TOPIC, EVENT=process.env.EVENT||'';
fs.mkdirSync(DIR,{recursive:true});
let v;
try{v=JSON.parse(fs.readFileSync(DIR+'/vapid.json','utf8'));}catch{v=webpush.generateVAPIDKeys();fs.writeFileSync(DIR+'/vapid.json',JSON.stringify(v));console.log('Llaves nuevas generadas');}
let pub='';try{pub=fs.readFileSync('push/vapid-public.txt','utf8').trim();}catch{}
if(pub!==v.publicKey){fs.writeFileSync('push/vapid-public.txt',v.publicKey+'\n');console.log('Llave pública actualizada');}
let subs=[];try{subs=JSON.parse(fs.readFileSync(DIR+'/subs.json','utf8'));}catch{}
try{
  const r=await fetch(`https://ntfy.sh/${TOPIC}/json?poll=1&since=all`);
  for(const line of (await r.text()).split('\n')){
    if(!line.trim())continue;let ev,s;try{ev=JSON.parse(line);}catch{continue;}
    if(ev.event!=='message')continue;try{s=JSON.parse(ev.message);}catch{continue;}
    if(!s||typeof s.endpoint!=='string'||!s.keys||!s.keys.p256dh||!s.keys.auth)continue;
    let host;try{host=new URL(s.endpoint).hostname;}catch{continue;}
    if(!/(^|\.)push\.apple\.com$|(^|\.)googleapis\.com$|(^|\.)mozilla\.com$|(^|\.)windows\.com$/.test(host))continue;
    const o={endpoint:s.endpoint,keys:{p256dh:s.keys.p256dh,auth:s.keys.auth},ts:ev.time||0},i=subs.findIndex(x=>x.endpoint===o.endpoint);
    if(i>=0)subs[i]=o;else subs.push(o);}
}catch(e){console.log('ntfy no respondió:',e.message);}
subs=subs.sort((a,b)=>b.ts-a.ts).slice(0,25);
console.log('Suscripciones:',subs.length);
let kick='';try{kick=fs.readFileSync('push/kick.txt','utf8');}catch{}
if(EVENT==='schedule'||EVENT==='workflow_dispatch'||(EVENT==='push'&&/send/.test(kick))){
  webpush.setVapidDetails('https://ivalrado.github.io/liftbound',v.publicKey,v.privateKey);
  const keep=[];
  for(const s of subs){
    try{await webpush.sendNotification(s,'1',{TTL:4*3600,urgency:'high'});keep.push(s);console.log('Enviado a',new URL(s.endpoint).hostname);}
    catch(e){console.log('Falló',new URL(s.endpoint).hostname,e.statusCode||e.message);if(![403,404,410].includes(e.statusCode))keep.push(s);}}
  subs=keep;}
fs.writeFileSync(DIR+'/subs.json',JSON.stringify(subs));
