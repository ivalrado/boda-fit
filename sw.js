/* Liftbound · avisos del héroe. El mensaje se decide aquí con lo que llevas del día. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const pad=n=>String(n).padStart(2,'0');
const dk=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
async function getState(){try{const c=await caches.open('lb-state'),r=await c.match('./__lbstate');return r?await r.json():null;}catch(e){return null;}}
function compose(st,now){
  const has=!!st;st=st||{};const t=dk(now),h=now.getHours(),dow=now.getDay(),N=st.name||'héroe',A=st.amor||'la princesa',Ac=A[0].toUpperCase()+A.slice(1);
  const td=st.trainDays||[false,true,true,true,true,true,false],train=!!td[dow],done=!!(st.done&&st.done[t]);
  let miss=0;if(has)for(let i=1;i<=7;i++){const d=new Date(now);d.setDate(d.getDate()-i);if(!td[d.getDay()])continue;if(st.done&&st.done[dk(d)])break;miss++;}
  const wg=st.wg||8,wa=(st.wa&&st.wa[t])||0,weighed=!!(st.w&&st.w[t]),din=!!(st.din&&st.din[t]),left=st.left||0,streak=st.streak||0;
  if(h<11){
    if(weighed)return ['☀️ Buenos días',pick([`Ya te pesaste. ${Ac} lo anotó en su diario.`,`Báscula ✓. Ahora un buen desayuno con proteína.`])];
    return ['⚖️ Hora de la báscula',pick([`Buenos días, ${N}. Súbete a la báscula antes de desayunar: La Sombra quiere saber cuánta vida le queda.`,`${Ac} pregunta cuánto pesas hoy. No la dejes en visto.`,left?`Te faltan ${left} kg para tu meta. Pésate y que La Sombra tiemble.`:`Pésate antes del café. Es una antorcha gratis 🔥`])];}
  if(h<17){
    if(wa>=wg)return ['💧 Bien hidratado',`${wa} vasos hoy. Tu héroe brilla como recién salido de la fuente.`];
    return ['💧 Tu héroe tiene sed',pick([`Llevas ${wa} de ${wg} vasos. Te estás secando como pasa.`,`Hidrátate, ${N}. Muchas veces el "hambre" es sed.`,`Cada vaso cuenta. Échate uno y regístralo.`])];}
  if(h<20){
    if(!train)return ['💤 Día de descanso',pick([`Hoy no toca gym. Tus músculos crecen mientras ves series.`,`Descansa, ${N}. Mañana la aventura sigue.`])];
    if(done)return ['🏆 Entreno hecho',pick([`Ya entrenaste hoy. La Sombra está sudando frío.`,streak>1?`Racha de ${streak} días. Así se rescata a ${A}.`:`Así se hace, ${N}. Un día más cerca.`])];
    if(miss>=2)return ['😢 '+miss+' días sin gym',pick([`${Ac} ya está viendo opciones en Tinder.`,`La Sombra ya le está decorando la torre a ${A}. ¿Hoy sí?`,`${miss} días… el monstruo del gym ya se instaló en tu sillón.`])];
    if(miss===1)return ['🍗 Ayer no fuiste',pick([`${Ac} vio cómo te comías el pollo frito. Hoy sí, ¿verdad?`,`Un día se perdona. Dos ya es costumbre. ¡Al gym!`])];
    return ['🏋️ Hora del gym',pick([`${N}, el monstruo del gym ya llegó. ¿Y tú?`,`${Ac} sigue en la torre. Tus piernas, en el sillón. ¡Al gym!`,`Cada serie es un golpe a La Sombra. Ve a darle.`])];}
  if(train&&!done)return ['🌙 Última llamada',pick([`Si hoy no entrenas, mañana sale la animación del pollo frito.`,`${Ac} se va a dormir llorando otra vez… a menos que vayas.`])];
  if(!din)return ['🍽️ ¿Y la cena?',pick([`Regístrala, o ${A} va a asumir que fue pollo frito.`,`Registra la cena y gana una antorcha 🔥.`])];
  return ['✨ Día completo',pick([`Tu héroe descansa en el campamento. Mañana sigue el camino.`,`Hoy cumpliste. Duerme 7 horas y mañana más.`])];}
self.addEventListener('push',e=>{e.waitUntil((async()=>{const [title,body]=compose(await getState(),new Date());
  await self.registration.showNotification(title,{body,tag:'lb-'+new Date().getHours(),data:{url:self.registration.scope}});})());});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil((async()=>{const all=await clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of all){if('focus' in c)return c.focus();}return clients.openWindow(e.notification.data&&e.notification.data.url||'./');})());});
